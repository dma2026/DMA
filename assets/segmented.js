/* A plain file GET per segment. The first file includes its initialization
   bytes, so a cold player can decode it before any other response arrives. */
const DMASegments = (() => {
  const tracks = /* manifest */ {};
  function attach(video, path, codec, duration, signal, fallback, jump, initialTime) {
    const [folder, starts, keys, opening, initData, overlap] = tracks[path];
    const media = new MediaSource();
    const url = URL.createObjectURL(media);
    let source, index = 0, next = 0, target = initialTime || 0, fetching = new Map();
    const files = starts.map((_, i) => i);
    if (!target && opening) files.splice(0, keys[1], ...opening);
    if (target) {
      for (const i of keys) if (starts[i] <= target) index = i;
      next = index;
    }
    // On a cold visit either of the first two necessary GETs can be the slow one.
    // Both carry the opening bytes. Append each byte once and keep the same decoder.
    const raceOpening = !initialTime && overlap && !navigator.connection?.saveData;
    let headBytes=0, headQueue=Promise.resolve(), resolveHead;
    const headReady=new Promise(resolve=>{resolveHead=resolve;});
    async function offerHead(start, bytes) {
      const write=headQueue.then(async()=>{
        const skip=Math.max(0,headBytes-start);
        if (skip>=bytes.length) return;
        await append(bytes.subarray(skip));
        headBytes=start+bytes.length;
        if (raceOpening && headBytes>=overlap[1]) resolveHead(null);
      });
      headQueue=write.catch(()=>{});
      await write;
    }
    const base = 'assets/segments/' + folder + '/';
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    function buffered(t) {
      for (let i=0; i<video.buffered.length; i++)
        if (t >= video.buffered.start(i)-.09 && t < video.buffered.end(i)) return video.buffered.end(i);
      return 0;
    }
    async function download(file, streamFirst=false, combined=false, enqueue) {
      let delivered = 0;
      for (let attempt=0; ; attempt++) {
        signal.throwIfAborted();
        const request = new AbortController();
        const cancel = () => request.abort();
        signal.addEventListener('abort', cancel, {once:true});
        let timeout;
        // An active transfer may legitimately take longer than one retry interval.
        const watchNetwork = () => {
          clearTimeout(timeout);
          timeout=setTimeout(cancel, 8000 + attempt*3000);
        };
        try {
          watchNetwork();
          const response = await fetch(base + file + '.m4s', {signal:request.signal,
            priority:file==='init' || streamFirst ? 'high' : 'auto'});
          if (!response.ok) throw Error('Video segment ' + response.status);
          const reader = response.body.getReader();
          let received=0;
          const remainder=[];
          while (true) {
            watchNetwork();
            const {done,value} = await reader.read();
            clearTimeout(timeout);
            if (done) break;
            const n = combined ? Math.min(value.length,Math.max(0,overlap[1]-received)) : streamFirst ? value.length : 0;
            if (n) await offerHead(received,value.subarray(0,n));
            const skip=Math.max(n,delivered-received);
            if (skip<value.length) {
              const part=value.subarray(skip);
              if (enqueue) enqueue(part);
              else remainder.push(part);
              if (enqueue) delivered=received+value.length;
            }
            received+=value.length;
          }
          if (combined && received<=overlap[1]) throw Error('Incomplete combined segment');
          return remainder.length ? new Blob(remainder).arrayBuffer() : null;
        } catch (error) {
          if (signal.aborted || attempt>=2) throw error;
        } finally {
          clearTimeout(timeout);
          signal.removeEventListener('abort',cancel);
        }
      }
    }
    // Download upcoming segments concurrently, but hand bytes to the decoder in
    // timeline order. The segment at the playhead can be decoded while it arrives.
    function pendingSegment(i) {
      const combined=raceOpening && i===1;
      return new ReadableStream({start(controller) {
        const transfer=download(combined ? overlap[0] : files[i],i===0,combined,
                                bytes=>controller.enqueue(bytes));
        const ready=raceOpening && i===0 ? Promise.race([transfer,headReady]) : transfer;
        ready.then(()=>controller.close(),error=>controller.error(error));
      }});
    }
    function append(bytes) {
      return new Promise((resolve,reject) => {
        const abort = () => finish(false), done = () => finish(true);
        function finish(ok) {
          source.removeEventListener('updateend', done);
          source.removeEventListener('error', abort);
          signal.removeEventListener('abort', abort);
          ok ? resolve() : reject(Error('Cannot append video segment'));
        }
        signal.addEventListener('abort',abort,{once:true});
        source.addEventListener('updateend',done,{once:true});
        source.addEventListener('error',abort,{once:true});
        try { signal.throwIfAborted(); source.appendBuffer(bytes); } catch {abort();}
      });
    }
    const seek = () => {
      if (target || !source || buffered(video.currentTime)) return;
      jump(video.currentTime);
    };
    video.addEventListener('seeking', seek, {signal});
    video.addEventListener('error', fallback, {signal});
    media.addEventListener('sourceopen', async () => {
      try {
        source = media.addSourceBuffer(codec);
        media.duration = duration;
        let init = index ? (initData ? Promise.resolve(Uint8Array.from(atob(initData),c=>c.charCodeAt(0))) : download('init')) : null;
        init?.catch(()=>{});
        if (target) video.currentTime=target;
        while (!signal.aborted && index < files.length) {
          // Preserve the native play control. Attaching a paused player fetches nothing.
          if (!target && (document.hidden || video.paused || buffered(video.currentTime)-video.currentTime > (navigator.connection?.saveData ? 11 : 30))) {
            await pause(40);
            continue;
          }
          while (next<files.length && next<index+3) {
            fetching.set(next,pendingSegment(next));
            next++;
          }
          if (init) { await append(await init); init=null; }
          const reader=fetching.get(index).getReader();
          while (!signal.aborted) {
            const {value,done}=await reader.read();
            if (done) break;
            await append(value);
          }
          fetching.delete(index++);
          if (target && buffered(target)) {
            const position = target;
            target = 0;
            video.currentTime = position;
          }
        }
        if (!signal.aborted && media.readyState==='open') media.endOfStream();
      } catch { if (!signal.aborted) fallback(); }
    }, {once:true,signal});
    return url;
  }
  return {has:path => Object.hasOwn(tracks,path), attach};
})();

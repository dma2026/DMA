/* A plain file GET per segment. The first file includes its initialization
   bytes, so a cold player can decode it before any other response arrives. */
const DMASegments = (() => {
  const tracks = /* manifest */ {};
  function attach(video, path, codec, duration, signal, fallback, jump, initialTime) {
    const [folder, starts, keys, opening, initData] = tracks[path];
    const media = new MediaSource();
    const url = URL.createObjectURL(media);
    let source, index = 0, next = 0, target = initialTime || 0, fetching = new Map();
    const files = starts.map((_, i) => i);
    if (!target && opening) files.splice(0, keys[1], ...opening);
    if (target) {
      for (const i of keys) if (starts[i] <= target) index = i;
      next = index;
    }
    const base = 'assets/segments/' + folder + '/';
    const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
    function buffered(t) {
      for (let i=0; i<video.buffered.length; i++)
        if (t >= video.buffered.start(i)-.09 && t < video.buffered.end(i)) return video.buffered.end(i);
      return 0;
    }
    async function download(file, streamFirst=false) {
      let committed=0;
      for (let attempt=0; ; attempt++) {
        signal.throwIfAborted();
        const request = new AbortController();
        const cancel = () => request.abort();
        signal.addEventListener('abort', cancel, {once:true});
        const timeout = setTimeout(cancel, 5000 + attempt * 2500);
        try {
          const response = await fetch(base + file + '.m4s', {signal:request.signal,
            priority:file==='init' || streamFirst ? 'high' : 'auto'});
          if (!response.ok) throw Error('Video segment ' + response.status);
          if (!streamFirst) return await response.arrayBuffer();
          const reader = response.body.getReader();
          let received=0;
          while (true) {
            const {done,value} = await reader.read();
            if (done) break;
            const skip = Math.max(0, committed-received);
            received+=value.length;
            if (skip<value.length) {
              await append(value.subarray(skip));
              committed=received;
            }
          }
          return null;
        } catch (error) {
          if (signal.aborted || attempt>=2) throw error;
        } finally {
          clearTimeout(timeout);
          signal.removeEventListener('abort',cancel);
        }
      }
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
          if (!target && (document.hidden || video.paused || buffered(video.currentTime)-video.currentTime > 11)) {
            await pause(40);
            continue;
          }
          while (next<files.length && next<index+3) {
            const promise=download(files[next],next===0);
            promise.catch(()=>{});
            fetching.set(next++,promise);
          }
          if (init) { await append(await init); init=null; }
          const bytes = await fetching.get(index);
          if (bytes) await append(bytes);
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

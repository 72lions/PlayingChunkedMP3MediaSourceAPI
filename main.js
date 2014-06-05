(function(undefined) {

  /**
   * A list with all the chunk filenames
   * @type {Array}
   */
  var _files = [
      'xa',
      'xb',
      'xc',
      'xd',
      'xe',
      'xf',
      'xg',
      'xh',
      'xi',
      'xj',
      'xk',
      'xl',
      'xm',
      'xn',
      'xo',
      'xp',
      'xq',
      'xr',
      'xs',
      'xt',
      'xu',
      'xv',
      'xw',
      'xx',
      'xy'];

  /**
   * The MediaSource that will be used for appending chunks.
   * @type {MediaSource}
   */
  var _mediaSource = new MediaSource();

  /**
   * The Audio html element.
   */
  var _audioEl = document.querySelector('#track');

  /**
   * The html element that will show the logs.
   */
  var _logEl = document.querySelector("#logger");

  /**
   * The MediaSource's AudioBuffer.
   */
  var _sourceBuffer;

  /**
   * Stores all the buffers that we load.
   * @type {Array}
   */
  var _loadedBuffers = [];

  /**
   * The audio analyser of the web audio API that will be used
   * for getting audio data.
   */
  var _analyser;

  /**
   * The Canvas html element.
   */
  var _canvas;

  /**
   * The 2D Canvas Context that will be used for drawing the frequency.
   */
  var _canvasContext;

  /**
   * Holds a counter with all cached the buffered that we send to the
   * SourceBuffer.
   * @type {Number}
   */
  var _itemsAppendedToSourceBuffer = 0;

  //#### LOGGER ###

  /**
   * The logger object is used for showing logs in an HTML element.
   * @type {Object}
   */
  var _logger = {
    log: function() {
      try {
      var args = Array.prototype.slice.call(arguments, 0);
        _logEl.textContent = args.join(' ') + '\n' + _logEl.textContent;
      } catch (e) {
        console.log(e);
      }
    }
  }

  //#### FILE LOADING ###

  /**
   * Loads a file as an array buffer.
   *
   * @param {String} filename The name of the file to load.
   * @param {Function} callback The callback that will be executed when the file is loaded.
   */
  function get(filename, callback) {
    var request = new XMLHttpRequest();
    request.responseType = 'arraybuffer';

    request.onreadystatechange = function() {
      if (request.readyState == 4 && (request.status == 200 || request.status == 304)) {
        callback(request.response);
      }
    };

    var file = 'chunks/' + filename;

    request.open('GET', file , true);
    request.send();
  }

  /**
   * It resolves a file name for the array and recursively loads
   * all the files.
   *
   * @param  {int} i The index of the file to load.
   */
  function startFileLoading(i) {
    // Load the chunk
    get(_files[i], function(result) {

      console.log('XMLHttpRequest: loaded', _files[i]);
      _logger.log('XMLHttpRequest: loaded', _files[i]);

      // Cache the buffer
      _loadedBuffers.push(result);

      if (!_sourceBuffer.updating) {
        loadNextBuffer();
      }

      if (i == 0) {
        // Start playback
        startPlayback();
      }

      i++;
      // Recursively load next chunk (if one exists)
      if (i < _files.length) {
        startFileLoading(i);
      }
    });
  }

  //#### AUDIO STUFF ###

  /**
   * It appends puts the next cached buffer into the source buffer.
   */
  function loadNextBuffer() {
    if (_loadedBuffers.length) {
      console.log('SourceBuffer: appending', _files[_itemsAppendedToSourceBuffer]);
      _logger.log('SourceBuffer: appending', _files[_itemsAppendedToSourceBuffer]);
      // append the next one into the source buffer.
      _sourceBuffer.appendBuffer(_loadedBuffers.shift());
      _itemsAppendedToSourceBuffer++;
    }

    if (_itemsAppendedToSourceBuffer >= _files.length && !_sourceBuffer.updating) {
      // else close the stream
      _mediaSource.endOfStream();
    }
  }

  /**
   * Will be executed when the MediaSource is open and it will start
   * loading the chunks recursively.
   */
  function sourceOpenCallback() {
    console.log('mediaSource readyState: ' + this.readyState);
    _logger.log('mediaSource readyState: ' + this.readyState);
    // Create the source buffer where we are going to append the
    // new chunks.
    _sourceBuffer = _mediaSource.addSourceBuffer('audio/mpeg');
    _sourceBuffer.addEventListener('updateend', loadNextBuffer, false);

    // Start
    startFileLoading(0);
  }

  /**
   * Will be executed when the MediaSource is closed.
   */
  function sourceCloseCallback() {
    console.log('mediaSource readyState: ' + this.readyState);
    _logger.log('mediaSource readyState: ' + this.readyState);
    _mediaSource.removeSourceBuffer(_sourceBuffer);
  }

  /**
   * Will be executed when the MediaSource is ended.
   */
  function sourceEndedCallback() {
    console.log('mediaSource readyState: ' + this.readyState);
    _logger.log('mediaSource readyState: ' + this.readyState);
  }

  /**
   * It starts playback.
   */
  function startPlayback() {
    if (_audioEl.paused) {
      _audioEl.play();
    }
  }

  //#### SETTING UP STUFF ###

  /**
   * Setups the Web Audio API.
   */
  function setupWebAudio() {
    var audioContext = new AudioContext();
    _analyser = audioContext.createAnalyser();
    var source = audioContext.createMediaElementSource(_audioEl);
    source.connect(_analyser);
    _analyser.connect(audioContext.destination);
  }

  /**
   * Will setup a canvas and a drawing context.
   */
  function setupDrawingCanvas() {
    _canvas = document.querySelector('canvas');
    // 1024 is the number of samples that's available in the frequency data
    _canvas.width = 800;
    // 255 is the maximum magnitude of a value in the frequency data
    _canvas.height = 255;
    _canvasContext = _canvas.getContext('2d');
    _canvasContext.fillStyle = '#cccccc';
  }

  //#### DRAWING SHIT ###

  /**
   * It is drawing the frequency at every frame.
   */
  function draw() {
    // Setup the next frame of the drawing
    requestAnimationFrame(draw);

    // Create a new array that we can copy the frequency data into
    var freqByteData = new Uint8Array(_analyser.frequencyBinCount);
    // Copy the frequency data into our new array
    _analyser.getByteFrequencyData(freqByteData);

    // Clear the drawing display
    _canvasContext.clearRect(0, 0, _canvas.width, _canvas.height);

    // For each "bucket" in the frequency data, draw a line corresponding to its magnitude
    for (var i = 0; i < freqByteData.length / 0.78; i++) {
      _canvasContext.fillRect(i * 2, _canvas.height - freqByteData[i * 2], 1, _canvas.height);
    }
  }

  // Necessary event listeners
  _mediaSource.addEventListener('sourceopen', sourceOpenCallback, false);
  _mediaSource.addEventListener('webkitsourceopen', sourceOpenCallback, false);
  _mediaSource.addEventListener('sourceclose', sourceCloseCallback, false);
  _mediaSource.addEventListener('webkitsourceclose', sourceCloseCallback, false);
  _mediaSource.addEventListener('sourceended', sourceEndedCallback, false);
  _mediaSource.addEventListener('webkitsourceended', sourceEndedCallback, false);

  // This starts the entire flow. This will trigger the 'sourceopen' event
  _audioEl.src = window.URL.createObjectURL(_mediaSource);

  // Typical setup of the Web Audio API and the scene.
  setupWebAudio();
  setupDrawingCanvas();
  draw();

}())

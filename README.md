#Playing a chunked MP3 with Media Source Extensions

In this proof of concept (currently only tested and working in Chrome 35+)
I've split the mp3 in 25 parts by using the unix split command.
The moment the first part is loaded then the playback starts immediately
and it loads the second.

When the second part is loaded then it is appended to the SourceBuffer
by using the Media Source Extensions API.

Check it out: <a href="http://72lions.github.io/PlayingChunkedMP3MediaSourceAPI/" target="_blank">Demo</a>

There is another implementation that I created a year ago which uses
only the Web Audio API. You can find it
<a href="https://github.com/72lions/PlayingChunkedMP3-WebAudioAPI" target="_blank">here</a>.


A lot of thanks to Theo for letting me use his awesome track
<a href="https://soundcloud.com/theokouroumlis/breathe-in">Breathe In</a>.

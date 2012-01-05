/* 
   1. Figure out the note value from each key
   2. Generate binary sample data for that note
   3. Dynamically create an audio element for each key	
   4. Create event listener for each button to trigger audio playback
*/


$(document).ready(function() {
      
  var $keys = $(".keys"),
    players = {};
      
  $("button", $keys).each(function (index, ele) {
    var $ele = $(ele),
      note,
      noteFreq,
      sine,
      tone,
      sample,
      samples,
      wavData,
      wavURI,
      attack = 0.001,
      decay = 0.25,
      sustain = 8000,
      audioNode;


    // 1. Figure out the note value from each key
    note = $ele.html().toUpperCase();
    noteFreq = notes[note];

    
    // 2. Generate the binary sample data for that note
    sine = SineGenerator(info, noteFreq);
    sine = AttackDecayGenerator(info.rate, attack, decay, sine);
    samples = synthesize(sine, sustain);
    //samples = echo(8000, 0.75, samples);
    wavData = wavEncode(info, samples);
    wavURI = wav(info, wavData);    
    
    // 3. Dynamically create an audio element for each key	
    audioNode = new Audio(wavURI);
    $ele.data('player', audioNode);    
    players[$ele.attr('data-yojimg-keycode')] = audioNode;

  });



  // 4. Create delegated event listener for each button to trigger audio playback
  $keys.on("click", "button", function(event) {
    event.preventDefault();
    $(this).data('player').play();
  });
    
  $('body').on("keydown", function(event) {
    event.preventDefault();
    
    var key = event.which;
    
    if (typeof players[key] !== "undefined") {
      players[key].play();
    }
    
  });
    
  


});



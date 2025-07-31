//A seperate js document for the changes i add that dont directly affect the other code, just so i can have some semblance
//of structure for my addons >w>
var audioPlayer = document.getElementById('audioPlayer');
var hoverSounds = document.querySelectorAll(".hovers");
var optionButtons = document.querySelectorAll("#options > button");
var buttons = document.querySelectorAll(".amog");
console.log(buttons[0]);
console.log(optionButtons[0]);


optionButtons.forEach(addAudioListener);
buttons.forEach(addAudioListener);
function addAudioListener(item, index) {
            item.addEventListener('mouseenter', hoverSoundSelection);
}

function hoverSoundSelection(){
    var randNum = (Math.floor(Math.random() * 5));
    if(this.disabled != true) {
      hoverSounds[randNum].load();
      hoverSounds[randNum].play().catch(error => {
      console.error('Playback failed: amogus', error);
    });}
}
function play(){
    audioPlayer.load(); // reload the audio player so that the audio restarts from the beginning on each click
    audioPlayer.play().catch(error => {
      console.error('Playback failed: amogus', error);
    });
}

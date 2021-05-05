import videojs from 'video.js';
import CustomProgressControl from './customProgressControl.js';
import CustomSeekBar from './customSeekBar.js';
import TrimButtom from './trimButton.js';

var Component = videojs.getComponent('Component');
var Player = videojs.getComponent('Player');

class TrimPlayer extends Player {
  constructor(tag, options, ready) {
    super(tag,options,ready);
    this.cache_.startTrimTime = 0.0;
    this.cache_.endTrimTime = 1.0;
    //this.on('durationchange', this.handleTechDurationChange);
  }

  // handleTechDurationChange = function(){
  //   this.duration(this.techGet_('duration'));
  //   this.cache_.endTrimTime = 1.0;
  // }

  startTrim(percentAsDecimal) { //aka player volume()
    let start;
    if (percentAsDecimal !== undefined) {
      // Force value to between 0 and 1
      start = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
      if(start < this.currentTime() / this.duration()){
        this.cache_.startTrimTime = start;
        this.trigger('starttrimchange');
        return;
      }
    }
    // Default to 1 when returning current volume.
    start = parseFloat(this.cache_.startTrimTime);
    return (isNaN(start)) ? 0 : start;
  }

  endTrim(percentAsDecimal) {
    let end;
    if (percentAsDecimal !== undefined) {
      // Force value to between 0 and 1
      end = Math.max(0, Math.min(1, parseFloat(percentAsDecimal)));
      if(end > this.currentTime() / this.duration()){
        this.cache_.endTrimTime = end;
        this.trigger('endtrimchange');
        return;
      }
    }
    end = parseFloat(this.cache_.endTrimTime);
    return (isNaN(end)) ? 1 : end;
  }

  updateProgressControl(isCustom){
    //let player = videojs.getPlayer('my-player')
    if(isCustom){
      //if already custom don't recustomize !
      if(this.getChild("ControlBar").getChild('CustomProgressControl')){
        console.log("custom player already present")
      }else{ //if not custom customize
        this.getChild("ControlBar").getChild('ProgressControl').dispose();
			  this.getChild("ControlBar").removeChild('ProgressControl')
        this.getChild("ControlBar").addChild('CustomProgressControl');
        let seekbar = this.getChild("ControlBar").getChild('CustomProgressControl').getChild("CustomSeekBar");
        seekbar.addChild("TrimButton",{orientationRight: true});
        seekbar.addChild("TrimButton",{orientationRight: false});
      }
    }else{
      //if already normal don't renormalize
      if(this.getChild("ControlBar").getChild('ProgressControl')){
        console.log("normal player already present")
      }else{ //if not normal normalize
        this.getChild("ControlBar").getChild('CustomProgressControl').dispose();
			  this.getChild("ControlBar").removeChild('CustomProgressControl')
        this.getChild("ControlBar").addChild('ProgressControl');
        this.currentTime(this.currentTime());
        this.trigger('starttrimchange');
      }
    }
  }

  //return the start time of the trimed video formatted as hh:mm:ss
  formatTrimStart(){
    return new Date(this.duration()*this.cache_.startTrimTime * 1000).toISOString().substr(11, 8);
  }

  //return the duration of the trimed video formatted as hh:mm:ss
  formatTrimDuration(){
    let durationSeconds = (this.cache_.endTrimTime - this.cache_.startTrimTime)*this.duration();
    return new Date(durationSeconds * 1000).toISOString().substr(11, 8)
  }
}
Component.registerComponent('TrimPlayer', TrimPlayer);

export default function createPlayer(id, options, ready){
  let player = videojs.getPlayer(id);
  if (player) {
    if (options) {
      console.log(`Player "${id}" is already initialised. Options will not be applied.`);
    }
    if (ready) {
      player.ready(ready); //ready is a callback that will be called once the player is ready
    }
    return player;
  }
  const normalizeId = (id) => id.indexOf('#') === 0 ? id.slice(1) : id;
  const el = (typeof id === 'string') ? videojs.dom.$('#' + normalizeId(id)) : id;
  if (!videojs.dom.isEl(el)) {
    throw new TypeError('The element or ID supplied is not valid. (videojs)');
  }
  options = options || {};

  videojs.hooks('beforesetup').forEach((hookFunction) => {
    const opts = hookFunction(el, videojs.mergeOptions(options));

    if (!isObject(opts) || Array.isArray(opts)) {
      log.error('please return an object in beforesetup hooks');
      return;
    }

    options = videojs.mergeOptions(options, opts);
  });
  let newPlayer = new TrimPlayer(el, options, ready);

  videojs.hooks('setup').forEach((hookFunction) => hookFunction(player));
  newPlayer.getChild("ControlBar").removeChild('FullscreenToggle');
  //player.getChild("ControlBar").removeChild('ProgressControl');
  //player.getChild("ControlBar").addChild('CustomProgressControl');
  //let seekbar = player.getChild("ControlBar").getChild('CustomProgressControl').getChild("CustomSeekBar");
  //seekbar.addChild("TrimButton",{orientationRight: true});
  //seekbar.addChild("TrimButton",{orientationRight: false});
  return newPlayer;
}

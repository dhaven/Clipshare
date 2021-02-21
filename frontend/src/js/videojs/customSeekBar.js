import videojs from 'video.js';

var SeekBar = videojs.getComponent('SeekBar');
var Component = videojs.getComponent('Component');
import clamp from './utils/clamp.js';

class CustomSeekBar extends SeekBar {
  constructor(player, options) {
    super(player, options);
  }

  update(event) {
    if(this.getProgress() >= this.player_.endTrim()){
      this.player_.pause();
    }else{
      super.update(event);
    }
  }
  handleMouseMove(event) {
    const seekBarEl = this.el();
    let seekBarPoint = videojs.dom.getPointerPosition(seekBarEl, event).x;
    seekBarPoint = clamp(seekBarPoint, 0, 1);
    if(seekBarPoint <= this.player_.startTrim() || seekBarPoint >= this.player_.endTrim()){
      console.log("mouse moved outside bounds")
    }else{
      console.log("mouse moved inside bounds")
      super.handleMouseMove(event);
    }
  }
}

CustomSeekBar.prototype.options_ = {
  children: [
    'loadProgressBar',
    'playProgressBar'
  ],
  barName: 'playProgressBar'
};

// MouseTimeDisplay tooltips should not be added to a player on mobile devices
if (!videojs.browser.IS_IOS && !videojs.browser.IS_ANDROID) {
  CustomSeekBar.prototype.options_.children.splice(1, 0, 'mouseTimeDisplay');
}

Component.registerComponent('CustomSeekBar', CustomSeekBar);
export default CustomSeekBar;

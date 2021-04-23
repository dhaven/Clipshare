import videojs from 'video.js';

var Component = videojs.getComponent('Component');
import clamp from './utils/clamp.js';

//represents either the start of the trim control or the end of the trim controle
class TrimButton extends Component {
  constructor(player, options = {}) {
    super(player,options);
    this.on('mousedown', this.handleMouseDown);
    this.on('touchstart', this.handleMouseDown);
    this.orientationRight(!!this.options_.orientationRight);
    if (this.orientationRight()) {
      console.log('will update on starttrimchange')
      this.on(this.player_, 'starttrimchange', this.update);
    }else{
      console.log('will update on endtrimchange')
      this.on(this.player_, 'endtrimchange', this.update);
    }
  }
  createEl() {
    return super.createEl('div', {
      className: 'vjs-trim-level',
      innerHTML: '<div class="vjs-start-trim-button"></div>'
    });
  }

  orientationRight(bool) {
    if (bool === undefined) {
      return this.orientationRight_ || false;
    }

    this.orientationRight_ = !!bool;

    if (this.orientationRight_) {
      this.addClass('vjs-trim-start');
    } else {
      this.addClass('vjs-trim-end');
    }
  }

  getPercent() {
    if(this.orientationRight()){
      return this.player_.startTrim()
    }else{
      return this.player_.endTrim()
    }
  }

  handleMouseDown(event) {
    const doc = this.el_.ownerDocument;
    if (!videojs.dom.isSingleLeftClick(event)) {
      return;
    }
    this.on(doc, 'mousemove', this.handleMouseMove);
    this.on(doc, 'mouseup', this.handleMouseUp);
    this.on(doc, 'touchmove', this.handleMouseMove);
    this.on(doc, 'touchend', this.handleMouseUp);

    this.handleMouseMove(event);
  }

  handleMouseMove(event){
    if (!videojs.dom.isSingleLeftClick(event)) {
      return;
    }
    this.orientationRight() ? this.player_.startTrim(this.calculateDistance(event)) : this.player_.endTrim(this.calculateDistance(event));
  }

  handleMouseUp(event){
    const doc = this.el_.ownerDocument;
    this.off(doc, 'mousemove', this.handleMouseMove);
    this.off(doc, 'mouseup', this.handleMouseUp);
    this.off(doc, 'touchmove', this.handleMouseMove);
    this.off(doc, 'touchend', this.handleMouseUp);

    this.update();

  }

  calculateDistance(event) {
    const position = videojs.dom.getPointerPosition(this.parentComponent_.el_, event);
    return position.x;
  }

  update() {
    const progress = this.getProgress();

    if(this.orientationRight()){
      this.requestNamedAnimationFrame('updateTrimLeft', () => {
        const sizeKey = 'left'
        this.el().style[sizeKey] = (progress * 100).toFixed(2) + '%';
      });
    }else{
      this.requestNamedAnimationFrame('updateTrimRight', () => {
        const sizeKey = 'right'
        this.el().style[sizeKey] = 100 - (progress * 100).toFixed(2) + '%';
      });
    }
    return progress;
  }
  getProgress() {
    return Number(clamp(this.getPercent(), 0, 1).toFixed(4));
  }
}

Component.registerComponent('TrimButton', TrimButton);
export default TrimButton;

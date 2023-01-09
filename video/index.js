const template_data = [
    {
      duration: 4,
      text: "场景1",
      color:"red",
      image:
        "https://tradeplus.oss-cn-hangzhou.aliyuncs.com/files/1668740372826-7c2b01e63c6c5071.jpg?x-oss-process=image/resize,w_720",
    },
  {
    duration: 5,
    color: "#fff",
    text: "场景2",
    video:
      "https://tradeplus.oss-cn-hangzhou.aliyuncs.com/videos/1669366990765-0de2dfc80dc7b347.mp4",
  },
  {
    duration: 2,
    text: "场景3",
    color:"red",
    image:
      "https://tradeplus.oss-cn-hangzhou.aliyuncs.com/files/1668740372826-7c2b01e63c6c5071.jpg?x-oss-process=image/resize,w_720",
  },
  {
    duration: 4,
    text: "场景4",
    color:"red",
    image:
      "https://tradeplus.oss-cn-hangzhou.aliyuncs.com/files/1668740372826-7c2b01e63c6c5071.jpg?x-oss-process=image/resize,w_720",
  },
];

let fps = 30;
let now;
let then = Date.now();
let interval = 1000 / fps;
let delta;

const calculateImage = (pw, ph, w, h) => {
  let px = 0;
  let py = 0;
  if (pw < w && ph < h) {
    px = 0.5 * w - 0.5 * pw;
    py = 0.5 * h - 0.5 * ph;
  } else if (ph / pw > h / w) {
    var uu = ph;
    ph = h;
    pw = (pw * h) / uu;
    px = 0.5 * w - 0.5 * pw;
  } else {
    var uu = pw;
    pw = w;
    ph = (ph * pw) / uu;
    py = 0.5 * h - 0.5 * ph;
  }
  return { px, py, pw, ph };
};

class VideoBuilder {
  constructor(id, width, height) {
    this.main = document.getElementById(id);
    if (!this.main) {
      throw new Error("canvas id 不能为空");
    }
    this.main_ctx = this.main.getContext("2d");
    this.width = width;
    this.height = height;
    this.child_canvas = [];
    this.scene = 0;
    this.duration = 0;
    this.template_data = [];
    this.initTemplates();
    this.player = null;
    this.initBuilder();
    this.playing = false;
  }

  initBuilder() {
    for (let item of this.template_data) {
      this.createScene(item);
    }
  }

  initTemplates() {
    let start = 0;
    for (let index in template_data) {
      const prev = this.template_data[index - 1];
      const item = template_data[index];
      if (prev) {
        start = prev.end;
      }
      this.template_data.push({
        start: start,
        end: (start += item.duration * 1000),
        ...item,
      });
    }
  }

  async createScene(item) {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    c.width = this.width;
    c.height = this.height;
    const url = item.image || item.video;
    const media = new Media(url);
    if (url) {
      await media.loadMedia(url);
    }
    item.media = media;
    this.child_canvas.push(c);
    this.drawScene(ctx, item, true);
    return c;
  }
  async drawScene(ctx, item) {
    ctx.clearRect(0, 0, this.width, this.height);

    const local = calculateImage(
      item.media.width,
      item.media.height,
      this.width,
      this.height
    );
    ctx.filter = "blur(30px)";

    // ctx.drawImage(mediaFrame, 0, 0, mw, mh, 0, top, fw, fh);
    ctx.drawImage(item.media.media_dom, 0, 0, this.width, this.height);
    ctx.filter = "none";
    if (item.media.media_type == "image") {
      ctx.drawImage(
        item.media.media_dom,
        local.px,
        local.py,
        local.pw,
        local.ph
      );
    }
    if (item.media.media_type == "video") {
      ctx.drawImage(
        item.media.media_dom,
        local.px,
        local.py,
        local.pw,
        local.ph
      );
    //   document.body.appendChild( item.media.media_dom)

    }

    ctx.font = "42px Microsoft YaHei";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillStyle = item.color || "red";
    ctx.fillText(item.text, this.width / 2, 50);
    ctx.fillText(this.duration, this.width / 2, 150);
    this.drawItem();
  }

  drawItem() {
    const can_item = this.child_canvas[this.scene];
    can_item.style.width=360+"px";
    can_item.style.height=640+"px";
    // document.body.appendChild(can_item)
    this.main_ctx.clearRect(0, 0, this.width, this.height);
    this.main_ctx.drawImage(can_item, 0, 0, this.width, this.height);
  }
  getTotal() {
    return this.template_data.reduce(
      (total, cur) => (total += cur.duration * 1000),
      0
    );
  }

  getScene() {
    return this.template_data.findIndex(
      (v) => this.duration >= v.start && this.duration <= v.end
    );
  }

  playItem() {
    this.scene = this.getScene();
    const can_item = this.child_canvas[this.scene];
    const ctx = can_item.getContext("2d");
    const item = this.template_data[this.scene];
    if (item.media.media_type == "video") {
      if (this.duration >= item.end) {
        item.media.media_dom.pause();
      } else {
        if (item.media.media_dom.currentTime == 0) {
          item.media.media_dom.play();
        }
      }
    }
    this.drawScene(ctx, item);
  }

  play() {
    this.playing = true;
    this.tick();
  }

  pause() {
    this.playing = false;
    for (let item of this.template_data) {
      if (item.media.media_type == "video") {
        item.media.media_dom.pause();
      }
    }
    cancelAnimationFrame(this.player);
  }

  tick() {
    this.player = requestAnimationFrame(() => this.tick());
    now = Date.now();
    delta = now - then;
    if (delta > interval) {
      this.duration += parseInt(interval);
      const total = this.getTotal();
      if (this.duration > total) {
        return cancelAnimationFrame(this.player);
      }
      // 这里不能简单then=now，否则还会出现上边简单做法的细微时间差问题。例如fps=10，每帧100ms，而现在每16ms（60fps）执行一次draw。16*7=112>100，需要7次才实际绘制一次。这个情况下，实际10帧需要112*10=1120ms>1000ms才绘制完成。
      then = now - (delta % interval);
      this.playItem(); //
    }
  }
}

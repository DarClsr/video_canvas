class Media {
  constructor(url) {
    this.media_dom = null;
    this.media_type = this.getMediaType(url);
    this.width = 0;
    this.height = 0;
  }

  getMediaType(url) {
    const [src, params] = url.split("?");
    const ext = src.split(".").pop();
    let type;
    if (["jpg"].includes(ext)) {
      type = "image";
    }
    if (["mp4"].includes(ext)) {
      type = "video";
    }
    return type;
  }

  loadMedia(url) {
    let media_dom;
    if (this.media_type == "image") {
      media_dom = document.createElement("img");
    }
    if (this.media_type == "video") {
      media_dom = document.createElement("video");
      media_dom.preload = "auto";
      media_dom.muted = true;
      media_dom.loop = false;
    }
    return new Promise((res, rej) => {
      if (this.media_type == "image") {
        media_dom.onload = () => {
          this.media_dom = media_dom;
          this.width = media_dom.naturalWidth;
          this.height = media_dom.naturalHeight;
          res(media_dom);
        };
      }
      if (this.media_type == "video") {
        media_dom.oncanplay = () => {
          this.media_dom = media_dom;
          this.width = media_dom.videoWidth;
          this.height = media_dom.videoHeight;

          res(media_dom);
        };
      }
      media_dom.src = url;
    });
  }
}

const v = document.createElement("video");
v.played;

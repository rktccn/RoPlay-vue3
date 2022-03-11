import { defineStore } from "pinia";
import { Howl, Howler } from "howler";
import { ElNotification } from "element-plus";
import { getTrackDetail, getMP3 } from "../apis/track";
import { timeFormat } from "../utils/common";

export const usePlayer = defineStore("player", {
  state: () => {
    return {
      isPlaying: false,
      progress: 0, // 当前播放进度
      volume: 0.5, // 音量 0-1

      currentTrack: null,
      trackList: [],
      currentIndex: 0, // 当前歌曲在列表中的index

      howler: null,
    };
  },
  getters: {
    getCurrentDuration() {
      return timeFormat(this.currentTrack?.dt) || "00:00";
    },

    getProgress() {
      return this.progress;
    },

    getVolume() {
      return this.volume;
    },
  },

  actions: {
    songPlay() {
      this.isPlaying = true;
      this.howler.play();
    },

    songPause() {
      this.isPlaying = false;
      this.howler.pause();
    },

    playOrPause() {
      this.isPlaying = !this.isPlaying;
      this.isPlaying ? this.songPlay() : this.songPause();
    },

    playPrev() {
      this.currentIndex === 0
        ? (this.currentIndex = this.trackList.length - 1)
        : this.currentIndex--;

      this.replaceCurrentTrack(this.trackList[this.currentIndex]);
    },

    playNext() {
      this.currentIndex === this.trackList.length - 1
        ? (this.currentIndex = 0)
        : this.currentIndex++;

      this.replaceCurrentTrack(this.trackList[this.currentIndex]);
    },

    playSong(source) {
      Howler.unload();
      this.howler = new Howl({
        src: [source],
        html5: true,
        volume: this.volume,
        format: ["mp3", "flac"],
      });
      this.setCurTimeIntervals();
      this.songPlay();

      this.howler.once("end", () => {
        this.playNext();
      });
    },

    replaceCurrentTrack(id) {
      getTrackDetail(id).then((res) => {
        getMP3(id).then((res2) => {
          if (res2.data[0].url) {
            let index = this.trackList.indexOf(id);
            if (index === -1) {
              this.trackList.push(id);
              this.currentIndex = this.trackList.length - 1;
            } else {
              this.currentIndex = index;
            }

            this.currentTrack = res.songs[0];
            this.playSong(res2.data[0].url);
          } else {
            ElNotification({
              title: "错误",
              message: "该歌曲暂时无法播放",
              position: "bottom-right",
              type: "error",
            });
            return;
          }
        });
      });
    },

    // 更新当前歌曲播放时间
    setCurTimeIntervals() {
      setInterval(() => {
        if (this.howler === null) return;
        this.progress = this.howler.seek() * 1000;
      }, 500);
    },

    // 设置当前歌曲时间
    setProgress(value) {
      if (this.howler) {
        this.howler.seek(value / 1000);
      }
    },

    setVolume(value) {
      console.log(value);
      if (Howler) {
        Howler.volume(value);
      }
      this.volume = value;
    },
  },
});

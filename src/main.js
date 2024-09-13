import data from "../database/songs.js"
const $ = document.querySelector.bind(document)
const $$ = document.querySelectorAll.bind(document)

const PLAYER_STORAGE_KEY = "PLAYER_STORAGE"

const player = $('.player')
const cd = $('.cd')
const heading = $('header h2')
const cdThumb = $('.cd-thumb')
const audio = $('#audio')
const playBtn = $('.btn-toggle-play')
const progress = $('#progress')
const nextBtn = $('.btn-next')
const prevBtn = $('.btn-prev')
const randomBtn = $('.btn-random')
const repeatBtn = $('.btn-repeat')
const playlist = $('.playlist')
const optionBtn = $('.option')
const optionList = $('.option-list')
const themeText = $('.theme-btn span')
const themeIcon = $('.theme-icon')
// Volume
const volumeBtn = $('.btn-volume')
const volumeWrap = $('.volume-wrap')
const volumeRange = $('.volume-range')
const volumeOutput = $('.volume-output')
// favorite box
const favoriteModal = $('.favorite_songs-modal')
const favoriteList = $('.favorite_songs-list')
const emptyList = $('.empty-list')
// Search
const searchBox = $('.search-box')
const searchInput = $('.search-bar')
const searchSongs = $('.search-songs')
// Xử lý cd-thumb quay và dừng
const cdThumbAnimate = cdThumb.animate([
    {
        transform: 'rotate(360deg)',
    }
], {
    duration: 20000,
    iterations: Infinity
})
cdThumbAnimate.pause()
const likedList = []
let randomFilter = []
let songsList
const app = {
    currentIndex: 0,
    isplaying: false,
    isRandom: false,
    isRepeat: false,
    config: JSON.parse(localStorage.getItem(PLAYER_STORAGE_KEY)) || {},
    setConfig: function (key, value) {
        this.config[key] = value
        localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(this.config))
    },
    songs: data.songs,
    render: function (songsArray, renderElm) {
        const htmls = songsArray.map((song, index) => {
            return `
                <div class= "song-node">
					<div class="song" data-index="${index}">
						<div class="thumb"
							style="background-image: url('${song.image}')">
						</div>
						<div class="body">
							<h3 class="title">${song.name}</h3>
							<p class="author">${song.singer}</p>
						</div>
						<div class="favorite">
							<i class="far fa-heart"></i>
						</div>
					</div>
                </div>    
				`
        })
        renderElm.innerHTML = htmls.join('')
        // console.log(typeof [...$$('.song')][0].innerText)
    },
    defineProperties: function () {
        Object.defineProperty(this, 'currentSong', {
            get: function () {
                return this.songs[this.currentIndex]
            }
        })
    },
    // Chuẩn hóa chuỗi sang unicode format
    removeAccents: function (str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    },
    handleEvents: function () {
        const _this = this
        const cdWidth = cd.offsetWidth
        // nhấn space để phát/dừng bài hát
        document.onkeydown = function (e) {
            e = e || window.event;
            // use e.keyCode
            if(e.code === "Space" && e.target === document.body){
                e.preventDefault()
                if (_this.isplaying) {
                    audio.pause()
                } else audio.play()
            }
        };
        // Click outside then close the opening box
        document.onclick = function (e) {
            if (!e.target.closest('.option')) {
                optionList.style.display = null
            }
            if (!e.target.closest('.btn-volume')) {
                volumeWrap.style.display = null
            }
            if (!e.target.closest('.search-box')) {
                searchSongs.style.display = null
                searchInput.setAttribute('style', 'border-bottom-right-radius: null; border-bottom-left-radius: null')
            }
        }

        //Searching  
        searchBox.onclick = function () {
            searchSongs.style.display = 'block'
            searchInput.setAttribute('style', 'border-bottom-right-radius: 0; border-bottom-left-radius: 0')
            songsList = $$('.song-node')
        }
        searchInput.oninput = function () {
            let searchValue = searchInput.value
            if (!searchValue) {
                searchSongs.innerHTML = ''
                return
            }
            let searchResult = [] 
            songsList.forEach(song => {
                let copySong = song.cloneNode(true)
                let songInfo = _this.removeAccents(copySong.innerText).toUpperCase()
                searchValue = _this.removeAccents(searchValue).toUpperCase()
                if(songInfo.includes(searchValue)) {
                    searchResult.push(copySong.innerHTML)
                }
            })
            // console.log(searchResult)
            searchSongs.innerHTML = searchResult.join('')
        }
        searchSongs.onclick = (e) => {
            playlist.onclick(e)
        }

        // Show option list 
        optionBtn.onclick = function (e) {
            optionList.style.display = !Boolean(optionList.style.display) ? 'block' : null
        }
        optionList.onclick = function (e) {
            // Chuyển mode sáng tối
            if (e.target.closest('.theme-btn')) {
                themeIcon.classList.toggle('fa-sun')
                $('body').classList.toggle('dark')
                themeText.textContent = themeIcon.classList.contains('fa-sun') ? 'Light mode' : 'Dark mode'
                _this.setConfig('classDark', $('body').className)
                e.stopPropagation()
            } else {
                // Mở box favorite song
                favoriteModal.style.display = 'flex'
                $('body').style.overflow = 'hidden'
                emptyList.style.display = favoriteList.childElementCount > 0 ? 'none' : null
            }
        }
        // Xử lý bấm vào nút close và ra ngoài thì đóng favorite box
        favoriteModal.onclick = function (e) {
            if (e.target.classList.contains('favorite_songs-close') || e.target.classList.contains('favorite_songs-modal')) {
                favoriteModal.style.display = null
                $('body').style.overflow = null
            } else {
                playlist.onclick(e)
            }
            emptyList.style.display = favoriteList.childElementCount > 0 ? 'none' : null
        }
        // Bật tắt volume
        volumeBtn.onclick = function () {
            volumeWrap.style.display = !Boolean(volumeWrap.style.display) ? 'block' : null
        }
        volumeWrap.onclick = function (e) {
            e.stopPropagation()
        }
        // Drag volume range
        volumeRange.oninput = function (e) {
            audio.volume = e.target.value / 100
            volumeOutput.textContent = e.target.value
            _this.setConfig('volume', e.target.value)
        }
        // Xử lý scale cd
        document.onscroll = function () {
            const scrollTop = window.scrollY || document.documentElement.scrollTop
            const newCdWidth = cdWidth - scrollTop
            cd.style.width = newCdWidth > 0 ? newCdWidth + 'px' : 0
            cd.style.opacity = newCdWidth / cdWidth
        }
        // Xử lý khi người dùng click vào play button
        playBtn.onclick = function () {
            if (_this.isplaying) {
                audio.pause()
            } else audio.play()
        }
        audio.onplay = function () {
            _this.isplaying = true
            player.classList.add('playing')
            cdThumbAnimate.play()
        }
        audio.onpause = function () {
            _this.isplaying = false
            player.classList.remove('playing')
            cdThumbAnimate.pause()
        }
        // Khi tiến độ bài hát thay đổi => thanh progress cũng thay đổi tương ứng
        audio.ontimeupdate = function () {
            if (audio.duration) {
                // Percent of progress
                const progressPercent = (audio.currentTime / audio.duration) * 100
                progress.value = progressPercent
                _this.setConfig('songCurrentTime', audio.currentTime)
                _this.setConfig('songProgressValue', progress.value)
            }
        }
        // Xử lý khi tua bài hát
        progress.oninput = function (e) {
            const seekTime = audio.duration * e.target.value / 100
            audio.currentTime = seekTime
        }
        // Kết thúc xử lý progress bar

        nextBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else _this.nextsong()
        }

        prevBtn.onclick = function () {
            if (_this.isRandom) {
                _this.playRandomSong()
            } else _this.prevsong()
        }
        audio.onended = function () {
            if (_this.isRepeat) {
                audio.play()
            } else nextBtn.click()
        }

        // Bật tắt nút random
        randomBtn.onclick = function () {
            _this.isRandom = !_this.isRandom
            _this.setConfig('isRandom', _this.isRandom)
            randomBtn.classList.toggle('active', _this.isRandom)
        }

        // Bật tắt nút repeat
        repeatBtn.onclick = function () {
            _this.isRepeat = !_this.isRepeat
            _this.setConfig('isRepeat', _this.isRepeat)
            repeatBtn.classList.toggle('active', _this.isRepeat)
        }
        // CLick vào playlist
        playlist.onclick = function (e) {
            const songNode = e.target.closest('.song:not(.active)')
            const favoriteIcon = e.target.closest('.favorite i')
            if (!favoriteIcon) {
                // Xử lý khi click để chuyển bài hát
                _this.currentIndex = Number(songNode.dataset.index)
                _this.loadCurrentSong()
                audio.play()
            } else {
                // Xử lý khi thả tim
                // Từ icon đã nhấn tim, trỏ tới Parent song của icon đó 
                let favoriteSong = favoriteIcon.parentNode.parentNode
                _this.handleLikedList([favoriteSong.dataset.index], favoriteSong.parentNode)
                _this.setConfig('likedListIndex', likedList)
            }
        }
    },
    // Xử lý danh sách bài hát yêu thích
    handleLikedList: function (favSongsIndex, unlikedParentNode) {
        // Duyệt mảng vị trí các bài hát đã bấm tim, nếu like thì thêm vào favorite box
        // bỏ like thì xóa khỏi favorite box, áp dụng cho cả loadconfig 
        favSongsIndex.forEach(function (index) {
            let favoriteSong = $$(`.song[data-index="${index}"]`)
            if (!favoriteSong.length) return
            favoriteSong.forEach(song => {
                song.classList.toggle('liked')
                song.querySelector('i').classList.toggle('fas')
            })
            favoriteSong = favoriteSong[0]
            console.log(favoriteSong)
            if (favoriteSong.classList.contains('liked')) {
                favoriteList.appendChild(favoriteSong.cloneNode(true))
                likedList.push(index)
            } else {
                let removeSong = $(`.favorite_songs .song[data-index="${index}"]`)
                favoriteList.removeChild(removeSong)
                likedList.splice(likedList.indexOf(index), 1)
            }
            // Xử lý khi bỏ tim từ favorite box -> bỏ tim bài hát ở playlist
            // khi bỏ tim từ favorite box thì parentNode = undefined
            if (!unlikedParentNode) {
                favoriteSong = $(`.song[data-index="${index}"]`)
                favoriteSong.querySelector('i').classList.remove('fas')
                favoriteSong.classList.remove('liked')
                likedList.splice(likedList.indexOf(index), 1)
            }
        })
    },
    // Focus, cuộn tới bài hát đang phát
    scrollToActiveSong: function () {
        setTimeout(() => {
            $('.playlist .song.active').scrollIntoView({
                behavior: "smooth",
                block: "end",
                inline: "nearest",
            })
        }, 300)
    },
    loadCurrentSong: function () {
        // Load Song Info
        heading.textContent = this.currentSong.name
        cdThumb.style.backgroundImage = `url('${this.currentSong.image}')`
        audio.src = this.currentSong.path
        // Add active class to Current Song on playlist and Favorite
        const activeSongs = $$('.song.active')
        const currentActiveSongs = $$(`.song[data-index= "${this.currentIndex}"]`)
        currentActiveSongs.forEach(activeSong => {
            activeSong.classList.add('active')
        })
        activeSongs.forEach(activeSong => {
            if (activeSong && activeSong.classList.contains('active')) {
                activeSong.classList.remove('active')
            }
        });

        // Lưu bài hát hiện tại vào localStorage
        this.setConfig('currentSongIndex', this.currentIndex)
        // scroll to current song
        this.scrollToActiveSong()
    },
    loadConfig: function () {
        this.isRandom = this.config.isRandom || false
        this.isRepeat = this.config.isRepeat || false
        randomBtn.classList.toggle('active', this.isRandom)
        repeatBtn.classList.toggle('active', this.isRepeat)
        this.currentIndex = this.config.currentSongIndex || 0
        progress.value = this.config.songProgressValue || 0
        audio.currentTime = this.config.songCurrentTime || 0
        // Load theme
        if (this.config.classDark) {
            themeIcon.classList.toggle('fa-sun')
            $('body').classList.toggle('dark')
            themeText.textContent = themeIcon.classList.contains('fa-sun') ? 'Light mode' : 'Dark mode'
        }
        // Load volume
        audio.volume = this.config.volume / 100 || 1
        volumeRange.value = this.config.volume || 100
        volumeOutput.textContent = this.config.volume || '100'
        // Load likedList
        if ('likedListIndex' in this.config && this.config.likedListIndex.length) {
            this.handleLikedList(this.config.likedListIndex, true)
        }
    },
    nextsong: function () {
        this.currentIndex++
        if (this.currentIndex >= this.songs.length) { this.currentIndex = 0 }
        this.loadCurrentSong()
        audio.play()
    },
    prevsong: function () {
        this.currentIndex--
        if (this.currentIndex < 0) { this.currentIndex = this.songs.length - 1 }
        this.loadCurrentSong()
        audio.play()
    },
    playRandomSong: function () {
        if(this.songs.length < 2) return
        let newIndex = this.currentIndex

        if (randomFilter.length == 0) {
            randomFilter.push(this.currentIndex)
        } else if (randomFilter.length == this.songs.length) {
            randomFilter.length = 0
            randomFilter.push(this.currentIndex)
        }

        do {
            newIndex = Math.floor(Math.random() * this.songs.length)
        } while (randomFilter.includes(newIndex))

        this.currentIndex = newIndex
        this.loadCurrentSong()
        audio.play()

        randomFilter.push(this.currentIndex)
    },
    start: function () {
        this.defineProperties()
        // xử lý các sự kiện (Dom Events)
        this.handleEvents()
        // render bài hát vào playlist
        this.render(this.songs, playlist)
        // Gán cấu hình đã lưu từ config vào Object
        this.loadConfig()
        // Tải thông tin bài hát đầu tiên vào UI khi chạy
        this.loadCurrentSong()
    }
}
app.start()

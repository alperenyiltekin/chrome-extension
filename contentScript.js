(() => {
    let currentVideoBookmarks   = [];
    let currentVideo            = '';
    let youtubeLeftControls, youtubePlayer;

    const newVideoLoaded = () => {
        const bookmarkBtnExists = document.getElementsByClassName('bookmark-btn')[0];
        currentVideoBookmarks   = await fetchBookmarks();

        if (!bookmarkBtnExists) {
            const bookmarkBtn       = document.createElement('img');
            bookmarkBtn.src         = chrome.runtime.getURL('assets/bookmark.png');
            bookmarkBtn.className   = 'ytp-button' + 'bookmark-btn';
            bookmarkBtn.title       = 'Click to bookmark current timestamp';

            youtubeLeftControls     = document.getElementsByClassName('typ-left-controls')[0];
            youtubePlayer           = document.getElementsByClassName('video-stream')[0];
            youtubeLeftControls.appendChild(bookmarkBtn);
            bookmarkBtn.addEventListener('click', addNewBookmarkEventHandler);
        }
    }

    const fetchBookmarks = () => {
        return new Promise(resolve => {
            chrome.storage.sync.get([ currentVideo ], (obj) => {
                resolve(
                    obj[ currentVideo ] 
                        ? JSON.parse(obj[ currentVideo ]) 
                        : []
                )
            })
        })
    }

    const addNewBookmarkEventHandler = async () => {
        const currentTime       = youtubePlayer.currentTime;
        const newBookmark       = {
            time        : currentTime,
            description : 'Bookmark at ' + getTime(currentTime)
        };
        currentVideoBookmarks   = await fetchBookmarks();

        chrome.storage.sync.set({
            [ currentVideo ] : JSON.stringify([ ...currentVideoBookmarks, newBookmark]
                .sort((a, b) => a.time - b.time))
        })
    }

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        const { type, value, videoId } = obj;

        if (type === 'NEW') {
            currentVideo = videoId;
            newVideoLoaded();
        } else if (type === 'PLAY') {
            youtubePlayer.currentTime = value;
        } else if (type === 'DELETE') {
            currentVideoBookmarks = currentVideoBookmarks.filter(b => b.time != value);
            chrome.storage.sync.set({
                [ currentVideo ] : JSON.stringify(currentVideoBookmarks)
            })
            response(currentVideoBookmarks);
        }
    })
    
    newVideoLoaded();
})();

const getTime = t => {
    let date = new Date(0);
    date.setSeconds(t);

    return DataTransfer.toISOString().substr(11, 8);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import EventEmitter from 'events';
import { Utils } from './Utils';
export class SpeechSynth extends EventEmitter {
    /*
    The constructor only required @Param is the TextContainer HTMLElement,
    the second @Param is an optional object and all its properties are optional as well
    */
    constructor(textContainer, { 
    /* Generic Settings */
    language = 'en', 
    /* Style */
    color1 = '#DEE', color2 = '#9DE', 
    /* Ev handlers */
    onEnd = () => null, onStart = () => null, onPause = () => null, onResume = () => null, onReset = () => null, onBoundary = () => null, onTimeTick = () => null, onWordClick = () => null, onSeek = () => null, onStateChange = () => null, onSettingsChange = () => null, onOptionsChange = () => null, onStyleChange = () => null, } = {
        /* Generic Settings */
        language: 'en',
        /* Style */
        color1: '#DEE',
        color2: '#9DE',
        /* Ev handlers */
        onPlay: () => null,
        onEnd: () => null,
        onStart: () => null,
        onPause: () => null,
        onResume: () => null,
        onReset: () => null,
        onBoundary: () => null,
        onTimeTick: () => null,
        onWordClick: () => null,
        onSeek: () => null,
        onStateChange: () => null,
        onSettingsChange: () => null,
        onOptionsChange: () => null,
        onStyleChange: () => null,
    }) {
        super();
        this.textContainer = textContainer;
        /* Instances */
        this.synth = window.speechSynthesis;
        this.utterance = new window.SpeechSynthesisUtterance();
        /* Timeouts */
        this.timeoutRef = undefined;
        /* Events */
        this.events = [
            { type: 'boundary', handlers: [onBoundary] },
            { type: 'time-tick', handlers: [onTimeTick] },
            { type: 'word-click', handlers: [onWordClick] },
            { type: 'start', handlers: [onStart] },
            { type: 'pause', handlers: [onPause] },
            { type: 'resume', handlers: [onResume] },
            { type: 'reset', handlers: [onReset] },
            { type: 'seek', handlers: [onSeek] },
            { type: 'end', handlers: [onEnd] },
            { type: 'state-change', handlers: [onStateChange] },
            { type: 'settings-change', handlers: [onSettingsChange] },
            { type: 'options-change', handlers: [onOptionsChange] },
            { type: 'style-change', handlers: [onStyleChange] },
        ];
        /* @@@ Proxies @@@ */
        /*
        Remember to perform the Reflection before anything else so they modifications to the instance properties
        are applied before any side effect is performed
        */
        /* Settings (Utterance settings) */
        const settingsSetter = (obj, key, value) => {
            const result = Reflect.set(obj, key, value);
            this.clearTimeCount(); // Reset timer when a setting changes since the utterance has to be restarted
            switch (key) {
                case 'voiceURI':
                    this.changeVoice();
                    break;
                case 'rate':
                    this.changeRate();
                    break;
                default:
            }
            /* Re initialize the utterance */
            this.initUtterance();
            this.restart('settings-change');
            this.emit('settings-change', this);
            return result;
        };
        this.settings = new Proxy({
            pitch: 1,
            voiceURI: '',
            language: language,
            rate: 1,
            volume: 0.5,
        }, {
            set: settingsSetter,
        });
        /* Reader Options */
        const optionsSetter = (obj, key, value) => {
            const result = Reflect.set(obj, key, value);
            /* Extra actions to perform internally when an option gets changed */
            switch (key) {
                case 'isChunksModeOn':
                    this.changeChunkMode();
                    break;
                case 'isUnderlinedOn':
                    this.applyStyleToHighlightedWords();
                    break;
                case 'isHighlightTextOn':
                    if (value) {
                        if (this.options.isChunksModeOn)
                            /* Highlight the current chunk */
                            this.highlightChunk(this.state.currentChunkIndex);
                    }
                    else
                        this.resetHighlight();
                    break;
            }
            this.emit('options-change', this);
            return result;
        };
        this.options = new Proxy({
            isHighlightTextOn: true,
            isChunksModeOn: Utils.isMobile(),
            isPreserveHighlighting: true,
            isUnderlinedOn: true,
        }, {
            set: optionsSetter,
        });
        /* State */
        const stateSetter = (obj, key, value) => {
            const result = Reflect.set(obj, key, value);
            switch (key) {
                case 'currentWordIndex':
                    this.emit('seek', this);
                    break;
                case 'elapsedTime':
                    if (this.state.elapsedTime % 1000 === 0) {
                        /* Instructions executed every 1000ms when the reader is active */
                        this.emit('time-tick', this);
                    }
                    break;
                default:
                //	console.log(key);
            }
            this.emit('state-change', this);
            return result;
        };
        this.state = new Proxy({
            isMobile: Utils.isMobile(),
            /* Internal properties */
            voice: {},
            voices: [],
            /* UI */
            isLoading: true,
            /* Highlight & Reading time */
            tagIndex: 0,
            currentWord: '',
            currentWordIndex: 0,
            currentWordProps: { charIndex: 0, charLength: 0 },
            highlightedWords: [],
            lastWordPosition: 0,
            numberOfWords: 0,
            wholeText: '',
            wholeTextArray: [],
            textRemaining: '',
            duration: 0,
            elapsedTime: 0,
            currentChunkIndex: 0,
            chunksArray: [],
            /* Controls  */
            isPaused: false,
            isReading: false,
        }, {
            set: stateSetter,
        });
        const styleSetter = (obj, key, value) => {
            const result = Reflect.set(obj, key, value);
            this.applyStyleToHighlightedWords();
            this.emit('style-change', this);
            return result;
        };
        this.style = new Proxy({ color1, color2 }, {
            set: styleSetter,
        });
    }
    /*
    This method handles the DOM traversing to add the Highlightint tags to the readable elements and all the logic in it is responsible
    for how the text content appears visually
    e.g. alignment of punctuation, spaces, etc...
    */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            /* Add custom methods to primitives */
            // eslint-disable-next-line no-extend-native
            Array.prototype.__join__ = Utils.__join__;
            /* Get voices */
            try {
                this.state.voices = yield this.getVoices();
                this.state.voice = this.state.voices[0];
                this.settings.voiceURI = this.state.voice.voiceURI;
                /* Add HTML highlight tags if SSR is off, in SSR the tags are added server side invoking the method ".addHTMLHighlightTags"
        on stringified HTML */
                this.addHTMLHighlightTags(this.textContainer);
                /* Add basic style to the words that have just been tagged wit HTML tags */
                this.applyBasicStyleToWords(this.textContainer, '[data-id]');
                /* Init state properties */
                /* Get the total number of words to highlight */
                this.state.numberOfWords = this.retrieveNumberOfWords(this.textContainer, '[data-id]');
                /* Get the whole raw text */
                this.state.wholeText = this.retrieveWholeText(this.textContainer, '[data-id]');
                this.state.textRemaining = this.state.wholeText;
                /* Get the total estimated duration of reading */
                this.state.duration = this.getTextDuration(this.state.wholeText, this.settings.rate);
                /* Get the array of words that will be read */
                this.state.wholeTextArray = this.retrieveWholeTextArray(this.textContainer, '[data-id]');
                this.state.chunksArray = this.retrieveChunks();
                /* -------------------------------------------------------------------- */
                /* Attach click event listener to words */
                this.attachEventListenersToWords(this.textContainer, '[data-id]', {
                    type: 'click',
                    fn: (e) => {
                        this.emit('word-click', this, e);
                    },
                });
                /* Add class custom event listeners */
                this.addCustomEventListeners();
                /* -------------------------------------------------------------------- */
                /* Init utterance settings */
                this.initUtterance();
                return this;
            }
            catch (e) {
                console.log('Init error', e);
                return this;
            }
        });
    }
    /* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ PRIVATE METHODS @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */
    initUtterance() {
        this.utterance.text = this.options.isChunksModeOn
            ? this.getCurrentChunkText()
            : this.getRemainingText();
        this.utterance.lang = this.settings.language;
        this.utterance.voice = this.state.voice;
        this.utterance.pitch = this.settings.pitch;
        this.utterance.rate = this.settings.rate;
        this.utterance.volume = this.settings.volume;
        /* Add the boundary handler to the utterance to manage the highlight ( no mobile supported ) */
        this.utterance.onboundary = this.handleBoundary.bind(this);
        /*
        When chunks mode is enabled this event is fired multiple times at the end of each chunk.
        Use this to manage chunk highlighting and extra logic that concerns chunks management
        */
        this.utterance.onend = (e) => {
            /* This prevents the execution of code if the end event is called in response to the reset method being called */
            if (this.state.isReading === false && this.state.isPaused === false)
                return;
            /* Emit the "end" event which signals the end of the WHOLE text, only when the whole text has finished to be read */
            if ((!this.options.isChunksModeOn &&
                this.state.currentWordIndex >=
                    this.state.wholeTextArray.length - 1) ||
                (this.options.isChunksModeOn &&
                    this.state.currentChunkIndex >=
                        this.state.chunksArray.length - 1))
                return this.emit('end', this);
            /* Emit the seek event to keep the UI seekbar in sync with the currentWordIndex */
            // this.emit('seek', this);
            /* Handle the highlight options change dynamically */
            /*
            If the isPreserveHighlighting option is disabled,
            it has to reset the highlighting of the whole previous chunk while skipping to the next one
            */
            if (!this.options.isPreserveHighlighting) {
                this.resetHighlight();
            }
            /* Manage the highlighting of the next chunk just before it starts */
            if (this.options.isChunksModeOn && this.state.isReading)
                this.handleChunkHighlighting();
            /* Finally play the next chunk */
            this.play('next-chunk-start');
        };
    }
    addHTMLHighlightTags(node) {
        const nodes = [...node.childNodes];
        nodes.forEach((el) => {
            /* Exclude code tags and its content from parsing */
            if (el.nodeType === 1 &&
                (el.tagName === 'PRE' ||
                    el.tagName === 'CODE'))
                return;
            /* Recurse if the element is an HTMLElement */
            if (el.nodeType === 1)
                this.addHTMLHighlightTags(el);
            /* Begin text node parsing if node type is TextNode */
            if (el.nodeType === 3) {
                if (Utils.isEmptyString(el.textContent) ||
                    Utils.isSpace(el.textContent) ||
                    Utils.isWhitespaceChar(el.textContent))
                    return;
                const wrapper = document.createElement('span');
                el.data
                    .split('')
                    .filter((char, i, arr) => {
                    /* Dismiss empty strings or non valid values */
                    if (!char)
                        return false;
                    /* Get rid of spaces between words and punctuation */
                    if (Utils.isSpace(char) &&
                        Utils.isPunctuation(arr[i + 1]))
                        return false;
                    /* Get rid of multiple spaces to avoid inconsistencies */
                    if (Utils.isSpace(char) && Utils.isSpace(arr[i + 1]))
                        return false;
                    return true;
                })
                    /* Separate special characters that will be read as single characters */
                    .map((c, i, arr) => {
                    /* Replace whitespace characters with common spaces */
                    if (Utils.isWhitespaceChar(c))
                        return ' ';
                    /* Separate the special readable characters like @#^*° so they can be read accordingly */
                    if (Utils.isSpecialReadableCharacter(c))
                        return ` ${c} `;
                    /* Handle dots in the middle of numbers e.g. 1.000 1.23 */
                    if (Utils.isDot(c) &&
                        Utils.isNumber(arr[i - 1]) &&
                        Utils.isNumber(arr[i + 1]))
                        return `${c}`;
                    /* Handle dots in the middle of words and numbers e.g. some.text e.g. abc33.bb32 ,
                    since in this case they are read as a character : "some dot text" "one dot zero zero zero" */
                    if (Utils.isDot(c) &&
                        Utils.isWordWithNumbers(arr[i - 1]) &&
                        Utils.isWordWithNumbers(arr[i + 1]))
                        return ` ${c} `;
                    /* Handle the punctation characters apart dots placed in the middle of a word e.g. test:test --> test: test */
                    if (Utils.isPunctuationButDot(c) &&
                        Utils.isWord(arr[i - 1]) &&
                        Utils.isWord(arr[i + 1]))
                        return `${c} `;
                    /* Handle multiple zeroes in a row, since they are read a single separated words */
                    return c;
                })
                    .join('')
                    .split(' ')
                    .forEach((word, i, arr) => {
                    if (!word)
                        return;
                    /* If it's a special unreadable character or a dot it does not add an highlight data-id since those characters won't  be read */
                    if (
                    // Utils.isPunctuation(word) ||
                    Utils.isSpecialUnreadableCharacter(word) ||
                        Utils.isWordInsideAngularBrackets(word)) {
                        const newEl = document.createTextNode(word + ' ');
                        wrapper.appendChild(newEl);
                    }
                    else {
                        /* In all other cases, which is, "plain words or slashes or any other readable character" we add the data-id attribute */
                        const newEl = document.createElement('span');
                        newEl.setAttribute('data-id', (this.state.tagIndex++).toString());
                        newEl.setAttribute('data-type', 'WORD');
                        /* Do not add a space after the word if it's a special readable character or if the next word is not a plain word */
                        if (Utils.isSpecialReadableCharacter(word) ||
                            Utils.isSpecialReadableCharacter(arr[i + 1]) ||
                            Utils.isDot(word) ||
                            Utils.isDot(arr[i + 1]) ||
                            Utils.isZero(word)) {
                            newEl.textContent = word;
                        }
                        else
                            newEl.textContent = word + ' ';
                        /* Add a space after the words that are Text words */
                        wrapper.appendChild(newEl);
                    }
                });
                node.replaceChild(wrapper, el);
            }
        });
    }
    /*  Highlight  */
    highlightChunk(idx) {
        const length = this.state.currentWordIndex + this.state.chunksArray[idx].length;
        for (let i = this.state.currentWordIndex; i < length; i++)
            this.highlightText(i);
    }
    retrieveChunks() {
        let currentPunctuationSymbol = '.';
        const chunks = [];
        let previousEnd = 0;
        /*
        Take into account that all the special readable characters will be counted as plain words hence we need to:
        - use the "wholeTextArray" which holds all the text elements that were wrapped in a span tag with a data-id attribute,
          this ensures that it will contain all readable content, since only readable words/characters are given such a wrap tag in
          "addHTMLHighlightTags" method.
          This further ensures to have a unique source of truth to keep in sync reading content and visual highlighting.
        - join with spaces every single character wrapped with a data-id attribute tag to be able to further split on given breakpoints
        - split in segments relative to periods that have words ending with a punctuation mark, to do so we use this regexp "/(?<=[a-zA-Z0-9])[.?!;]/"
          to make sure to select any punctuation mark that is preceeded by a word
          ( to avoid to consider punctuation in the middle of words as chunk edges, we use the wholeTextArray array
            which already owns all characters that will be read, included dots in the middle of words e.g. text.text -> "text dot text" ).
        - for each of the chunk extracted we build an object containg all the info on the chunk, start,end,length, index and text.
          The text is the content that will be passed to the speech synth
        - The chunk text has to be further manipulated since now as we manipulated the chunk the dots in the middle of the word won't be read as they are detached from the previous and next words.
          The strategy here is the same used in the "retrieveWholeText" method, which is: using the custom __join__ method
          tho use a space " " to join all the plain words and a no space "" to join the words that have a punctuation element next to them and dots element themselves */
        this.state.wholeTextArray
            .join(' ')
            /* Alternative regexps:
            1- /(?<![\s])[.?!;]+(?=[\s\n])/ This is safer since it just checks if there are spaces before and after the dot
            2- /(?<=[a-zA-Z0-9])[.?!;]/  This does not take into account dots placed after a special character like a parens e.g. (word). <-- That dot won't be matched
            */
            .split(/(?<![\s])[.?!;]+(?=[\s\n])/)
            .forEach((c, i) => {
            if (Utils.isPunctuation(c))
                currentPunctuationSymbol = c;
            else {
                const length = c
                    .trim()
                    .split(/[\s]/)
                    .filter((el) => el).length;
                /*  */
                const text = c.split(/\s+/).__join__((el, i, arr) => {
                    if (Utils.isPunctuation(arr[i + 1]) ||
                        Utils.isDot(el)) {
                        return '';
                    }
                    else
                        return ' ';
                });
                const result = {
                    text: text + currentPunctuationSymbol,
                    length: length,
                    start: previousEnd,
                    end: previousEnd + length - 1,
                    idx: i,
                };
                previousEnd = previousEnd + length;
                chunks.push(result);
            }
        });
        return chunks;
    }
    handleChunkHighlighting() {
        // eslint-disable-next-line prettier/prettier
        const currentChunk = this.state.chunksArray[this.state.currentChunkIndex];
        // eslint-disable-next-line prettier/prettier
        const nextChunk = this.state.chunksArray[++this.state.currentChunkIndex];
        this.utterance.text = nextChunk.text;
        /* Keep the currentWordIndex in sync */
        this.state.currentWordIndex += currentChunk.length;
        /* Highlight the next chunk */
        this.highlightChunk(this.state.currentChunkIndex);
    }
    scrollTo(idx) {
        const el = this.textContainer.querySelector(`[data-id="${idx}"]`);
        if (el)
            el.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
    }
    /* Timer */
    timeCount(e, frequency) {
        if (frequency % 10 !== 0)
            throw new Error('Frequency must be a multiple of 10');
        this.state.elapsedTime += frequency;
        this.timeoutRef = setTimeout(this.timeCount.bind(this, e, frequency), frequency);
    }
    clearTimeCount() {
        clearTimeout(this.timeoutRef);
    }
    resetTimeCount() {
        this.state.elapsedTime = 0;
        this.clearTimeCount();
    }
    /* Handle the boundary event */
    handleBoundary(e) {
        /* Disable boundary if it's in chunk mode */
        if (this.options.isChunksModeOn)
            return;
        this.state.currentWord =
            this.state.wholeTextArray[this.state.currentWordIndex];
        const previousWord = this.state.wholeTextArray[this.state.currentWordIndex - 1];
        /* This is very important since it ensures the sync among words that are read
        and those that are highlighted is not messed up  */
        if (e.name !== 'word' || e.charLength === 0)
            return;
        /*
        Disable boundary if the word is the repetition of the previous one, this happens in certain cases like numbers
        e.g. 1000 is spelled "one thousand" even if it's just one word, hence the boundary is fired twice and dates.
        This increase consistency in visual highlighting and audio sync.
        */
        if ((Utils.isNumber(previousWord) || Utils.isValidDate(previousWord)) &&
            e.charIndex === this.state.currentWordProps.charIndex &&
            e.charLength === this.state.currentWordProps.charLength)
            return;
        /* Sync current word props */
        this.state.currentWordProps = {
            charIndex: e.charIndex,
            charLength: e.charLength,
        };
        /* Highlight the current word */
        this.highlightText(this.state.currentWordIndex);
        /* Increase the current index of word read */
        this.state.currentWordIndex += 1;
        /* Synchronize the chunk index */
        if (/[.?!;]+/.test(this.state.wholeTextArray[this.state.currentWordIndex]))
            this.state.currentChunkIndex++;
        /* Emit boundary event */
        this.emit('boundary', this, e);
    }
    /* VOICES ARE POPULATED ASYNCHRONOUSLY ON BROWSER LOAD */
    getVoices() {
        return new Promise((resolve, reject) => {
            let id = null;
            try {
                id = setInterval(() => {
                    if (this.synth.getVoices().length !== 0) {
                        resolve(this.synth
                            .getVoices()
                            .filter((voice) => voice.lang.startsWith(this.settings.language)));
                        clearInterval(id);
                    }
                }, 10);
            }
            catch (e) {
                reject(e);
                clearInterval(id);
            }
        });
    }
    highlightText(wordIndex) {
        /* Do not highlight if the option is disabled */
        if (!this.options.isHighlightTextOn)
            return;
        // eslint-disable-next-line prettier/prettier
        const wordToHighlight = this.textContainer.querySelector(`[data-id="${wordIndex}"]`);
        if (!wordToHighlight)
            return;
        /* Update highlighted words array */
        this.state.highlightedWords.push(wordToHighlight);
        /* Calculate current word position */
        const position = wordToHighlight.getBoundingClientRect().x;
        /* Scroll to the right row position */
        if (position <= this.state.lastWordPosition)
            this.scrollTo(this.state.currentWordIndex);
        /* Reset the row highlight only if it's not in chunks mode.
           In chunks mode, it has to be managed during the chunks switch ( in the "onend" handler) */
        if (!this.options.isPreserveHighlighting &&
            !this.options.isChunksModeOn) {
            this.resetHighlight();
            this.state.highlightedWords = [wordToHighlight];
        }
        /* Update last word position */
        this.state.lastWordPosition = position;
        /* Apply highlight style */
        this.applyStyleToWord(wordToHighlight);
    }
    applyStyleToWord(el) {
        el.style.backgroundColor = this.style.color1;
        el.style.color = this.style.color2;
        el.style.boxShadow = `10px 0px 0px 0px ${this.style.color1} -10px 0px 0px 0px ${this.style.color1}`;
        el.style.textDecoration = this.options.isUnderlinedOn
            ? 'underline'
            : 'none';
    }
    /* Private handlers for proxy traps */
    changeChunkMode() {
        this.clearTimeCount();
        /* Since che chunk mode change triggers a restart of the utterance playing,
        make sure the current word index gets synchronized with the current chunk index start word,
        since the sentence is restarted from the first word of the sentence itself */
        // eslint-disable-next-line prettier/prettier
        this.state.currentWordIndex =
            this.state.chunksArray[this.state.currentChunkIndex].start;
        /* This manages the starting highlight if chunk mode is on or off:
            1. if it starts in single word mode and it gets changed to chunk mode, it highlights the whole chunk
            2. if it starts in chunk mode and it gets changed to single word mode, it resets all the current highlighthing and starts to highlight words singularly */
        if (this.options.isChunksModeOn) {
            this.utterance.text = this.getCurrentChunkText();
            this.highlightChunk(this.state.currentChunkIndex);
        }
        else {
            this.utterance.text = this.getRemainingText();
            this.resetHighlight();
        }
        this.restart('chunks-mode-change');
    }
    changeVoice() {
        const voice = this.state.voices.filter((v) => v.voiceURI === this.settings.voiceURI).length > 0
            ? this.state.voices.filter((v) => v.voiceURI === this.settings.voiceURI)[0]
            : this.state.voices[0];
        this.state.voice = voice;
        this.utterance.voice = voice;
    }
    changeRate() {
        this.state.duration = this.getTextDuration(this.state.wholeText, this.settings.rate);
        /* Recalculate time elapsed */
        this.state.elapsedTime = this.getAverageTextElapsedTime(this.state.wholeTextArray, this.state.currentWordIndex)(this.settings.rate);
        this.emit('time-tick', this, this.state.elapsedTime);
    }
    applyStyleToHighlightedWords() {
        this.state.highlightedWords.forEach((w) => this.applyStyleToWord(w));
    }
    resetHighlight() {
        this.state.highlightedWords.forEach((n) => {
            n.style.backgroundColor = '';
            n.style.color = '';
            n.style.boxShadow = '';
            n.style.textDecoration = 'none';
            this.state.highlightedWords = [];
        });
    }
    addCustomEventListeners() {
        this.events.forEach((e) => {
            if (e.handlers.length > 0) {
                for (const handler of e.handlers) {
                    if (Utils.isFunction(handler))
                        this.on(e.type, handler.bind(this));
                }
            }
        });
    }
    attachEventListenersToWords(node, selector, { type, fn }) {
        [...node.querySelectorAll(selector)].forEach((el) => {
            el.addEventListener(type, fn);
        });
    }
    getRemainingText() {
        const length = this.state.wholeTextArray.length;
        /* Calculate and set the remaining text */
        return this.state.wholeTextArray
            .slice(this.state.currentWordIndex, length + 1)
            .__join__((el, i, arr) => {
            if (Utils.isDot(arr[i + 1]) || Utils.isDot(el)) {
                return '';
            }
            else
                return ' ';
        });
    }
    getCurrentChunkText() {
        return this.state.chunksArray[this.state.currentChunkIndex].text;
    }
    retrieveNumberOfWords(node, selector) {
        return [...node.querySelectorAll(selector)].length;
    }
    retrieveWholeText(node, selector) {
        return [...node.querySelectorAll(selector)]
            .map((el) => el.textContent)
            .__join__((el, i, arr) => {
            if (Utils.isPunctuation(arr[i + 1]) ||
                Utils.isDot(el)) {
                return '';
            }
            else
                return ' ';
        });
    }
    retrieveWholeTextArray(node, selector) {
        return [...node.querySelectorAll(selector)].map((el) => el.textContent);
    }
    applyBasicStyleToWords(node, selector) {
        [...node.querySelectorAll(selector)]
            .filter((el) => el && !Utils.isPunctuation(el.textContent))
            .forEach((el) => {
            if (!el)
                return;
            el.style.transition = 'all 0.4s';
        });
    }
    getTextDuration(str, rate) {
        return (str.length * 100 * 1) / rate;
    }
    getAverageTextElapsedTime(textArray, idx) {
        const _text = textArray.slice(0, idx).join(' ');
        return (rate) => this.getTextDuration(_text, rate);
    }
    delayRestart(type, delay) {
        return setTimeout(() => {
            this.synth.cancel();
            if (this.isReading())
                this.play(type);
            if (this.isPaused()) {
                this.play(type).then(() => this.pause());
                this.pause();
            }
        }, 500);
    }
    restart(type) {
        this.synth.cancel();
        if (this.isReading())
            this.play(type);
        if (this.isPaused()) {
            this.play(type).then(() => this.pause());
            this.pause();
        }
    }
    /* @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ PUBLIC METHODS - EXPOSED API @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
  @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@ */
    /* Control methods */
    seekTo(idx) {
        /* Reset timeouts  */
        this.clearTimeCount();
        /* Sync the current chunk in both cases that the seeking is performed in chunk or non chunk mode */
        const chunk = this.state.chunksArray.find((c) => idx >= c.start && idx <= c.end);
        this.state.currentChunkIndex = chunk.idx;
        if (!this.options.isChunksModeOn) {
            /* Set the new text slice */
            this.state.textRemaining = this.getRemainingText();
            /* Update current word index */
            this.state.currentWordIndex = idx;
            /* Update utterance instance with  the new text slice */
            this.utterance.text = this.state.textRemaining;
            /* Highlight */
            this.resetHighlight();
            this.highlightText(this.state.currentWordIndex);
        }
        else {
            /* In Chunks mode sync the current word index with the start of the chunk */
            this.state.currentWordIndex = chunk.start;
            this.utterance.text = chunk.text;
            /* Highlight */
            this.resetHighlight();
            this.highlightChunk(this.state.currentChunkIndex);
        }
        /* Recalculate time elapsed */
        this.state.elapsedTime = this.getAverageTextElapsedTime(this.state.wholeTextArray, this.state.currentWordIndex)(this.settings.rate);
        this.emit('time-tick', this, this.state.elapsedTime);
        this.restart('seek');
    }
    /* ------------------------------------------------------------------------------------ */
    /* Public Methods to control the player state */
    /* ------------------------------------------------------------------------------------ */
    play(type) {
        this.synth.cancel(); // Makes sure the queue is empty when starting
        this.clearTimeCount(); // Makes sure to not trigger multiple timeouts
        this.synth.speak(this.utterance);
        this.state.isPaused = false;
        this.state.isReading = true;
        this.timeCount(null, 20);
        switch (type) {
            case 'start': {
                this.emit('start', this);
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        /* Highlight the first chunk on the first start if it's chunks mode ON / mobile */
                        if (this.options.isChunksModeOn)
                            this.highlightChunk(0);
                        resolve(null);
                    };
                });
            }
            case 'resume-chunk-mode': {
                this.emit('resume-chunk-mode', this);
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        resolve(null);
                    };
                });
            }
            case 'next-chunk-start': {
                this.emit('next-chunk-start', this, this.state.chunksArray[this.state.currentChunkIndex]);
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        resolve(null);
                    };
                });
            }
            case 'settings-change': {
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        resolve(null);
                    };
                });
            }
            case 'chunks-mode-change': {
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        resolve(null);
                    };
                });
            }
            default:
                return new Promise((resolve) => {
                    this.utterance.onstart = (e) => {
                        resolve(null);
                    };
                });
        }
    }
    pause() {
        this.synth.pause();
        this.state.isPaused = true;
        this.state.isReading = false;
        this.emit('pause', this);
        /* Pause timer */
        this.clearTimeCount();
    }
    resume() {
        if (!this.options.isChunksModeOn)
            this.synth.resume();
        else
            this.play('resume-chunk-mode');
        this.state.isPaused = false;
        this.state.isReading = true;
        this.emit('resume', this);
        /* Restart timer */
        this.timeCount(null, 20);
    }
    reset() {
        this.synth.cancel();
        this.resetHighlight();
        /* Reset timer */
        this.resetTimeCount();
        const propsToReset = {
            textRemaining: this.state.wholeText,
            currentWordIndex: 0,
            currentChunkIndex: 0,
            highlightedWords: [],
            lastWordPosition: 0,
            isPaused: false,
            isReading: false,
        };
        for (const entry of Object.entries(propsToReset))
            this.state[entry[0]] = entry[1];
        /* Reset the utterance state ( needed to reset the text utterance ) */
        this.initUtterance();
        /* Scroll back to top word */
        this.scrollTo(1);
        this.emit('reset', this);
    }
    /* Utility getters */
    isReading() {
        return this.state.isReading;
    }
    isPaused() {
        return this.state.isPaused;
    }
}
//# sourceMappingURL=SpeechSynth.js.map
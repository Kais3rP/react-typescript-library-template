# react-text2speech

[![NPM](https://img.shields.io/npm/v/react-text2speech.svg)](https://www.npmjs.com/package/react-text2speech)
[![npm](https://img.shields.io/npm/dm/react-text2speech.svg)](https://www.npmjs.com/package/react-text2speech)

## Try it out

Try it [here](https://kais3rp.github.io/react-text2speech/)

## Introduction

A React Component that leverages WEB Speech API to implement a text reader for web pages.

## Features:

-   Voice language customization
-   Highlight of text during reading
-   Full control on timeline by sliding seekbar or by manually clicking text words
-   Preview of reading time ( time is averagely calculated )
-   Control reading speed
-   Select voice type and language

## Notes

Since the speech engine behaves differently on mobile browsers or according to the selected language, there are some optimization workaround to prevent special characters like "/" or "-" to send out of sync the highlighting of text. There surely are some cases that have not yet been taken into account, if you are experiencing any problem you are kindly asked to open an issue.
Stuff inside `<code>` tags won't be parsed and the engine is not going to read it, for the same reason stated above.
More info are provided in the _Edge Cases_ section.

## Install

```bash
npm install --save react-text2speech
```

Or with yarn:

```bash
yarn add react-text2speech
```

## Usage

Check the `example` folder for a comprehensive example of how to import and use the React Component in your application._

1. Import the Component and hook that exports some methods and state variables that lets you control the reader also from your Application:
   `import TextReader, { useTextReader } from 'react-text2speech';`
2. The hook returns a set of state variables and some handlers which are used internally by the Reader Component and a "bindReader" method which has to be passed to the Textreader as a prop in order to be able to bind your Application state to the Reader state:

```javascript
const { bindReader, handlers, state } = useTextReader();
const { play, pause, showReader, hideReader, minimizeReader, maximizeReader } = handlers;
const { isReading, isLoading, isVisible } = state;
```

3. The basic usage is:

```javascript
const [node, setNode] = useState(null);

```
Then return:

```javascript

<div ref={setNode}>Some text to be read here</div>
{node && <TextReader textContainer={node} />}

```

Where `node` must be an `HTMLElement` containing the text or HTML child nodes containing text, that you want to be read.
Since in React the DOM refs receive the reference to the DOM element after the first render, the best way to pass the `ref` to the `TextReader` Component is setting it as a React State.

4. A more complex usage, as the one showed in the example folder leverages the "useTextReader" hook:

```javascript

	const [node, setNode] = useState(null);

	const { bindReader, handlers, state } = useTextReader();

	const { play, pause, showReader } = handlers;
	const { isReading, isLoading, isVisible } = state;

	return (
		<div>		
			{node && (
				<TextReader
					textContainer={node}
					options={{ language: 'en' }}
					bindReader={bindReader}
				/>
			)}
			<button
				className={styles.play}
				onClick={
					isReading
						? pause
						: () => {
								if (!isVisible) showReader();
								play();
						  }
				}
			>
				{isReading ? 'Pause' : 'Play'}
			</button>
			{isLoading && <div className="loader">Loading...</div>}
			<div ref={setNode}>
				<h1>Ut vero dolorem ea illum fugit.</h1>
			</div>
		</div>
	)
```

As you can see in this example we use some of the handlers exposed by the `useTextReader` hook to control the reader directly with a `button` and some of the *state variables* to control our UI.
It's important ot remember to pass the `bindReader` function to the *reader* if we want to control it with custom controls.


5. The `TextReader` Component expects just the `textContainer` prop as required, you can pass two extra props though to tweak style and options:

## API / Props

| Props         | Default value                                                                      | Required | Type |
| ------------- | ---------------------------------------------------------------------------------- | -------- | ---- |
| textContainer | undefined                                                                          | true     | HTMLElement |
| bindReader    | undefined                                                                          | false    | function |
| styleOptions  | { primaryColor: '#00D', secondaryColor: '#55F', bgColor: '#FFF', textColor: '#222', highlightColor1: '#306EFF', highlightColor2: '#FCDFFF', } | false    | object |
| options       | { language: 'en' }                                                                 | false    | object |

**Remember to set the language accordingly to the language of the text that it's going to be read, it's enough you type the first locale letters e.g. "en", "de", "fr", etc... **

## Edge Cases

There are some edge cases not yet covered and hardly coverable with extreme precision since the speech synth handles some special characters like "/" or "." and "," in numbers ( 1.000 , 1,000 ) in different ways depending on the language choosen, some locales use "." for decimals, others use ",".
Some cases are automically covered during the content parsing, for example if you happen to have grammar inconstencies like "word , word" instead of "word, word", they are going to be fixed automatically.
Some edge cases like dots in the middle of word like "some.word" are going to be parsed and read as "dot" in english, while dots used as punctuation marks won't be read by the synth.
These are currently the issues and edge cases not yet covered:

-   Punctuation marks directly after an HTML tag won't be taken into account as a chunk delimiter.

## License

MIT © [react-text2speech](https://github.com/Kais3rP/react-text2speech)

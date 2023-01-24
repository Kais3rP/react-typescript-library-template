import { useReader, useStore, useMainProps } from 'contexts';
import { useMemo, useEffect } from 'react';
import { setIsVisible, setIsMinimized, setIsLoading, changeOptions, changeSettings, setDuration, setNumberOfWords, setVoices, } from 'store/actions';
export const useBindTextReader = () => {
    const { reader } = useReader();
    const { state, dispatch } = useStore();
    const { isMinimized, isVisible, isReading, isLoading } = state;
    const { bindReader } = useMainProps();
    const handlers = useMemo(() => ({
        showReader: () => {
            dispatch(setIsVisible(true));
        },
        hideReader: () => {
            dispatch(setIsVisible(false));
        },
        minimizeReader: () => {
            dispatch(setIsMinimized(true));
        },
        maximizeReader: () => {
            dispatch(setIsMinimized(false));
        },
        play: () => {
            if (reader === null || reader === void 0 ? void 0 : reader.isPaused())
                reader === null || reader === void 0 ? void 0 : reader.resume();
            else
                reader === null || reader === void 0 ? void 0 : reader.play('start').then(() => {
                    dispatch(setIsLoading(false));
                });
        },
        pause: () => reader === null || reader === void 0 ? void 0 : reader.pause(),
    }), [dispatch, reader]);
    useEffect(() => {
        if (!bindReader || typeof bindReader !== 'function')
            return;
        const exposedState = { isMinimized, isVisible, isReading, isLoading };
        bindReader(exposedState, handlers);
    }, [
        bindReader,
        dispatch,
        handlers,
        isLoading,
        isMinimized,
        isReading,
        isVisible,
    ]);
};
export const useInitializeReader = () => {
    const { reader } = useReader();
    const { dispatch } = useStore();
    useEffect(() => {
        /* Reset browser active speech synth queue on refresh or new load */
        window.speechSynthesis.cancel();
        reader === null || reader === void 0 ? void 0 : reader.init().then((reader) => {
            var _a;
            const formattedVoices = (_a = reader.state.voices) === null || _a === void 0 ? void 0 : _a.map((voice) => {
                var _a;
                return ({
                    name: (_a = voice.name) === null || _a === void 0 ? void 0 : _a.replace(/(Microsoft\s)|(Online\s)|(\(Natural\))|(\s-.*$)/gm, // Display only the plain voice name
                    ''),
                    value: voice.voiceURI,
                });
            });
            /* Synchronize UI state with reader initial state */
            dispatch(setVoices(formattedVoices));
            dispatch(setNumberOfWords(reader.state.numberOfWords));
            dispatch(setDuration(reader.state.duration));
            dispatch(changeSettings(reader.settings));
            dispatch(changeOptions(reader.options));
        }).catch((e) => console.log(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
export const useSetCSSVAriables = () => {
    const { styleOptions } = useMainProps();
    useEffect(() => {
        for (const entry of Object.entries(styleOptions))
            document.documentElement.style.setProperty(`--${entry[0]}`, entry[1]);
    }, [styleOptions]);
};
//# sourceMappingURL=hooks.js.map
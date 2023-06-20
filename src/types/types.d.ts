/* eslint-disable no-unused-vars */

declare global {
	type Interval = ReturnType<typeof setInterval>;
	type Timeout = ReturnType<typeof setTimeout>;

	interface IStyleTheme {
		primaryColor: string;
		secondaryColor: string;
		bgColor: string;
		textColor: string;
	}

	interface IVoiceInfo {
		name: string;
		value: string;
	}
}

import styled from 'styled-components';

interface IIcon {
	styleoptions: IStyleOptions;
}

interface ISlider {
	styleoptions: IStyleOptions;
}

/* Styled Components */

export const SliderContainer = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	width: 70px;
	& input {
		width: 100%;
	}

	& label {
		position: absolute;
		top: 0;
		font-size: 0.7rem;
		right: 0%;
	}

	& label.value {
		top: -1rem;
		color: var(--color-extra1);
	}
`;

export const StyledSlider = styled.input<ISlider>`
	width: 100%;
	appearance: none;
	height: 2px;
	background: ${(props: any) => props.styleoptions.primaryColor};
	outline: none;
	opacity: 0.7;
	transition: opacity 0.2s;
	&:hover {
		opacity: 1;
	}
	::-webkit-slider-thumb {
		appearance: none;
		width: 10px; /* Set a specific slider handle width */
		height: 10px; /* Slider handle height */
		background: ${(props: any) => props.styleoptions.bgColor};
		cursor: pointer; /* Cursor on hover */
		border: 2px solid ${(props: any) => props.styleoptions.primaryColor};
		border-radius: 50%;
		z-index: 1;
		box-shadow: 0 2px 5px
			${(props: any) => props.styleoptions.secondaryColor};
		transition: transform 0.1s ease-out;
	}
	::-moz-range-thumb {
		appearance: none;
		width: 10px; /* Set a specific slider handle width */
		height: 10px; /* Slider handle height */
		background: ${(props: any) => props.styleoptions.bgColor};
		cursor: pointer; /* Cursor on hover */
		border: 2px solid ${(props: any) => props.styleoptions.primaryColor};
		border-radius: 50%;
		z-index: 1;
		box-shadow: 0 2px 5px
			${(props: any) => props.styleoptions.secondaryColor};
		transition: transform 0.4s ease-out;
	}

	&::-webkit-slider-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 10px ${(props: any) => props.styleoptions.bgColor};
	}

	::-moz-range-thumb:hover {
		transform: scale(1.1);
		box-shadow: 0 2px 10px ${(props: any) => props.styleoptions.bgColor};
	}

	&::-webkit-slider-thumb:active {
	}

	::-moz-range-thumb:active {
	}
`;

export const Icon = styled.div<IIcon>`
	font-size: 0.9rem;
	margin-right: 5px;
	& * {
		stroke: ${(props: any) => props.styleoptions.primaryColor};
		color: ${(props: any) => props.styleoptions.primaryColor};
	}
`;
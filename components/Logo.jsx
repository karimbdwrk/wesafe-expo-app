import Svg, { Path, G } from "react-native-svg";

const Logo = () => {
	const fillColor = "#111827";
	return (
		<Svg viewBox='0 0 264.3 297.85' width={60} height={60}>
			<G>
				<G>
					<Path
						fill={fillColor}
						d='M108.85,167.5v-54.85h20.57v75.42H54v-75.42h20.57v54.85h6.86v-54.85h20.57v54.85h6.86Z'
					/>
					<Path
						fill={fillColor}
						d='M211.7,133.22h-75.42v-20.57h75.42v20.57ZM211.7,160.65h-75.42v-20.57h75.42v20.57ZM211.7,188.07h-75.42v-20.57h75.42v20.57Z'
					/>
				</G>
			</G>
		</Svg>
	);
};

export default Logo;

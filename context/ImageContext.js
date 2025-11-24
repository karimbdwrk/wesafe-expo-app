import React, { createContext, useContext, useState } from "react";

const ImageContext = createContext();

export const ImageProvider = ({ children }) => {
	const [image, setImage] = useState(null);
	const [signature, setSignature] = useState(null);

	return (
		<ImageContext.Provider
			value={{ image, setImage, signature, setSignature }}>
			{children}
		</ImageContext.Provider>
	);
};

export const useImage = () => useContext(ImageContext);

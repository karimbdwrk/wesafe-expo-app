import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
	const [colorMode, setColorMode] = useState("light");
	const [isLoading, setIsLoading] = useState(false);

	const toggleColorMode = () => {
		const newMode = colorMode === "dark" ? "light" : "dark";
		setColorMode(newMode);
		console.log("✨ Theme toggled to:", newMode);
	};

	const setTheme = (mode) => {
		setColorMode(mode);
		console.log("✨ Theme set to:", mode);
	};

	return (
		<ThemeContext.Provider
			value={{
				colorMode,
				toggleColorMode,
				setTheme,
				isDark: colorMode === "dark",
				isLoading,
			}}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme doit être utilisé dans un ThemeProvider");
	}
	return context;
};

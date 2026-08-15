import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

const THEME_STORAGE_KEY = "@wesafe_theme_mode";

export const ThemeProvider = ({ children }) => {
	const [colorMode, setColorMode] = useState("dark");
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		AsyncStorage.getItem(THEME_STORAGE_KEY)
			.then((stored) => {
				if (stored === "dark" || stored === "light") {
					setColorMode(stored);
				}
			})
			.catch((err) => {
				console.error("Erreur lecture thème persisté:", err);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	const persist = (mode) => {
		AsyncStorage.setItem(THEME_STORAGE_KEY, mode).catch((err) => {
			console.error("Erreur sauvegarde thème:", err);
		});
	};

	const toggleColorMode = () => {
		const newMode = colorMode === "dark" ? "light" : "dark";
		setColorMode(newMode);
		persist(newMode);
		console.log("✨ Theme toggled to:", newMode);
	};

	const setTheme = (mode) => {
		setColorMode(mode);
		persist(mode);
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

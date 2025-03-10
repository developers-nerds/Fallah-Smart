export const storage = {
  // Other methods...
  
  getTokens: async () => {
    try {
      const tokensJSON = await AsyncStorage.getItem('tokens');
      if (!tokensJSON) return null;
      
      const tokens = JSON.parse(tokensJSON);
      console.log('Retrieved tokens from storage:', tokens);
      return tokens;
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  },
  
  setTokens: async (accessToken, refreshToken) => {
    try {
      // Store tokens in a format that's easy to use throughout the app
      const tokens = {
        access: accessToken,
        refresh: refreshToken
      };
      await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
      console.log('Tokens saved successfully');
      return true;
    } catch (error) {
      console.error('Error setting tokens:', error);
      return false;
    }
  }
}; 
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const WalletScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallet Balance</Text>
      <Text>Current Balance: $1,234.56</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default WalletScreen;

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StockScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stock Information</Text>
      <Text>Product: Example Product</Text>
      <Text>Available Units: 150</Text>
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

export default StockScreen;

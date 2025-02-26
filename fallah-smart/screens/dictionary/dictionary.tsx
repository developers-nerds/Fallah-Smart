import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const dictionaryData = [
  { term: "React", definition: "A JavaScript library for building user interfaces." },
  { term: "JavaScript", definition: "A high-level, dynamic, untyped, and interpreted programming language." },
  { term: "Node.js", definition: "A JavaScript runtime built on Chrome's V8 JavaScript engine." },
  { term: "Expo", definition: "A framework and platform for universal React applications." },
  { term: "Navigation", definition: "The process of moving between different screens or pages within an application." }
];

const DictionaryScreen = () => {
  return (
    <ScrollView style={styles.container}>
      {dictionaryData.map((entry, index) => (
        <View key={index} style={styles.entry}>
          <Text style={styles.term}>{entry.term}</Text>
          <Text style={styles.definition}>{entry.definition}</Text>
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff'
  },
  entry: {
    marginBottom: 20,
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  term: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  definition: {
    fontSize: 16,
    marginTop: 5
  }
});

export default DictionaryScreen;

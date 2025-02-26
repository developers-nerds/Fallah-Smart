import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const blogsData = [
  { id: '1', title: 'Blog Post 1', content: 'This is the content of blog post 1.' },
  { id: '2', title: 'Blog Post 2', content: 'This is the content of blog post 2.' },
  { id: '3', title: 'Blog Post 3', content: 'This is the content of blog post 3.' },
];

const BlogsScreen = () => {
  return (
    <FlatList
      data={blogsData}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.postContainer}>
          <Text style={styles.postTitle}>{item.title}</Text>
          <Text style={styles.postContent}>{item.content}</Text>
        </View>
      )}
      style={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  postContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postContent: {
    fontSize: 16,
    marginTop: 5,
  },
});

export default BlogsScreen;

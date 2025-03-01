import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ChatInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onSendImage: () => void;
  onVoiceInput: () => void;
}

const ChatInput = ({
  value,
  onChangeText,
  onSend,
  onSendImage,
  onVoiceInput,
}: ChatInputProps) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder="Type a message..."
        placeholderTextColor="#666"
      />
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={onSendImage} style={styles.iconButton}>
          <MaterialIcons name="image" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onVoiceInput} style={styles.iconButton}>
          <MaterialIcons name="mic" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onSend} style={styles.iconButton}>
          <MaterialIcons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    alignItems: "center",
    backgroundColor: "#1E1E1E",
  },
  input: {
    flex: 1,
    backgroundColor: "#333",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    color: "#fff",
    marginRight: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginHorizontal: 5,
    padding: 5,
  },
});

export default ChatInput;

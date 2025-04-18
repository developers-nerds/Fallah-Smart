import { View, StyleSheet, Button } from "react-native";
import * as Speech from "expo-speech";

export default function SpeechComponent() {
  const speak = () => {
    const thingToSay = "1";
    Speech.speak(thingToSay);
  };

  return (
    <View style={styles.container}>
      <Button title="اضغط لسماع بعض الكلمات" onPress={speak} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#ecf0f1",
    padding: 8,
  },
});

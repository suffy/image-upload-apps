import {
  ActivityIndicator,
  Button,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

const imgDir = FileSystem.documentDirectory + "images/";

const ensureDirExists = async () => {
  const dirInfo = await FileSystem.getInfoAsync(imgDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(imgDir, { intermediates: true });
  }
};

export default function Index() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    await ensureDirExists();
    const files = await FileSystem.readDirectoryAsync(imgDir);
    console.log("files", files);
    console.log("images", images);
    if (files.length > 0) {
      setImages(files.map((f) => imgDir + f));
    }
  };

  const selectImage = async (useLibrary: boolean) => {
    let result;

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    };

    if (useLibrary) {
      result = await ImagePicker.launchImageLibraryAsync(options);
    } else {
      await ImagePicker.requestCameraPermissionsAsync;
      result = await ImagePicker.launchCameraAsync(options);
    }

    if (!result.canceled) {
      saveImage(result.assets[0].uri);
    }
  };

  const saveImage = async (uri: string) => {
    await ensureDirExists();
    const filename = new Date().getTime() + ".jpg";
    const dest = imgDir + filename;

    await FileSystem.copyAsync({ from: uri, to: dest });

    setImages([...images, dest]);

    console.log("images", images);
  };

  const deleteImage = async (uri: string) => {
    await FileSystem.deleteAsync(uri);
    setImages(images.filter((i) => i !== uri));
  };

  const url = process.env.EXPO_PUBLIC_API_URL;

  const uploadImage = async (uri: string) => {
    setLoading(true);

    const response = await FileSystem.uploadAsync(`${url}/file`, uri, {
      fieldName: "file",
      httpMethod: "POST",
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      headers: {
        "Content-Type": "multipart/form-data",
        "X-Api-Key": `${process.env.EXPO_PUBLIC_API_KEY}`,
      },
    });

    console.log("response", response);

    setTimeout(() => {
      setLoading(false);
    }, 3000);
    // setLoading(false);
  };

  const renderItem = ({ item }: { item: string }) => {
    const filename = item.split("/").pop();
    return (
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          margin: 1,
          alignItems: "center",
        }}
      >
        <Image source={{ uri: item }} style={{ width: 80, height: 80 }} />
        <Text style={{ flex: 1 }}>{filename}</Text>
        <Ionicons.Button
          name="cloud-upload"
          onPress={() => uploadImage(item)}
        />
        <Ionicons.Button name="trash" onPress={() => deleteImage(item)} />
      </View>
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        gap: 20,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-evenly",
          marginVertical: 20,
        }}
      >
        <Button title="Photo Library" onPress={() => selectImage(true)} />
        <Button title="Capture Image" onPress={() => selectImage(false)} />
      </View>

      <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
        My Images
      </Text>
      <FlatList data={images} renderItem={renderItem} />

      {loading && (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center" },
          ]}
        >
          <ActivityIndicator color="#fff" animating size={"large"} />
        </View>
      )}
    </SafeAreaView>
  );
}

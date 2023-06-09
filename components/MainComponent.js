import React, {useState, useEffect, useRef} from 'react';
import {Alert, Dimensions, Keyboard, StyleSheet, View} from 'react-native';
import TopBar from './TopBar';
import BottomBar from './BottomBar';
import ResponseContainer from './ResponseContainer';
import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';

import {PermissionsAndroid} from 'react-native';

function MainComponent() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const ScrollViewRef = useRef(null);
  const textRef = useRef(null);
  const [text, setText] = useState('');
  const [canRecord, setCanRecord] = useState(true);
  const [responseLoading, setResponseLoading] = useState(false);
  const [messageState, setMessageState] = useState('');
  const [voiceInit, setVoiceInit] = useState(false);

  const changeButton = txt => {
    setText(txt);
    if (txt.length <= 0) {
      setCanRecord(true);
    } else {
      setCanRecord(false);
    }
  };

  useEffect(() => {
    Tts.setDefaultLanguage('en-US');
    Tts.setDefaultRate(0.5);
    Tts.setDefaultPitch(1);
  }, []);

  const speak = text => {
    Tts.stop();
    Tts.speak(text);
  };

  Voice.onSpeechStart = () => {
    setIsRecognizing(true);
  };

  Voice.onSpeechEnd = () => {
    setIsRecognizing(false);
    setVoiceInit(true);
  };

  Voice.onSpeechResults = result => {
    let text = result.value[0];
    function capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    setClient(
      JSON.stringify(capitalizeFirstLetter(text)).replace(/"/g, ''),
      textRef,
    );
  };

  const startRecording = async () => {
    Tts.stop();
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: 'Microphone Permission',
          message: 'This app needs access to your microphone',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        await Voice.start('en-US');
      } else {
        const askAgain = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message:
              'App needs access to your microphone to record audio. Please grant permission.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'Grant Permission',
          },
        );
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const stopRecording = async () => {
    try {
      await Voice.stop();
    } catch (e) {
      console.error(e);
    }
    setIsRecognizing(false);
  };

  const clearChat = () => {
    Alert.alert(
      'Delete all messages',
      'Are you sure you want to continue?',
      [
        {
          text: 'Cancel',
          onPress: handleCancel,
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: handleOk,
        },
      ],
      {cancelable: false},
    );
  };
  const handleOk = () => {
    setBubbles([]);
    setShowDeleteDialog(false);
  };

  const handleCancel = () => {
    setShowDeleteDialog(false);
  };

  const setClient = (message, textBox) => {
    setCanRecord(true);
    if (message !== '') {
      textBox.current.clear();
      setBubbles(prevBubbles => [
        ...prevBubbles,
        {
          role: 'user',
          content: message,
        },
      ]);
      setMessageState(message);
      setVoiceInit(false);
      ScrollViewRef.current.scrollToEnd({animated: true});
    }
  };

  useEffect(() => {
    const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
    if (bubbles.length > 0 && bubbles.length % 2 !== 0) {
      if (
        messageState.toLowerCase().includes('generate') &&
        messageState.toLowerCase().includes('image')
      ) {
        const imageInput = messageState.toLowerCase().split('generate');
        setResponseLoading(true);
        fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: imageInput[1],
            size: '256x256',
          }),
        })
          .then(response => response.json())
          .then(data => {
            console.log(data.data[0].url);
            setBubbles(prevBubbles => [
              ...prevBubbles,
              {
                role: 'assistant',
                content: `Here's your image for the entered query -${imageInput[1]}`,
                imageUrl: data.data[0].url,
              },
            ]);
            if (voiceInit) {
              speak(
                `Here's your image for the entered query -${imageInput[1]}`,
              );
            }
            setResponseLoading(false);
            ScrollViewRef.current.scrollToEnd({animated: true});
          })
          .catch(error => console.log(error));
      } else {
        const model = 'gpt-3.5-turbo';
        const maxTokens = 500;
        const temperature = 0.7;

        console.log('Bubbles are: ', bubbles);
        setResponseLoading(true);

        const bubbleFilter = bubbles.map(obj =>
          Object.keys(obj).reduce((acc, key) => {
            if (!'imageUrl'.includes(key)) {
              acc[key] = obj[key];
            }
            return acc;
          }, {}),
        );

        fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            messages: bubbleFilter,
            model,
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        })
          .then(response => response.json())
          .then(data => {
            console.log('Data is: ', data);
            setBubbles(prevBubbles => [
              ...prevBubbles,
              {
                role: 'assistant',
                content: data.choices[0].message.content,
              },
            ]);
            if (voiceInit) {
              speak(data.choices[0].message.content);
            }
            setResponseLoading(false);
            ScrollViewRef.current.scrollToEnd({animated: true});
          })
          .catch(error => console.log(error));
      }
    }
  }, [bubbles]);
  const [containerHeight, setContainerHeight] = useState('91%');
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      event => {
        setContainerHeight('86%');
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setContainerHeight('91%'); // set back to original height
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const styles = StyleSheet.create({
    viewContainer: {
      width: '100%',
      height: '100%',
      backgroundColor: '#00080C',
    },
    contentContainer: {
      height: containerHeight,
    },
  });

  return (
    <View style={styles.viewContainer}>
      <TopBar clearChat={clearChat} />
      <View style={styles.contentContainer}>
        <ResponseContainer
          handleOk={handleOk}
          handleCancel={handleCancel}
          showDeleteDialog={showDeleteDialog}
          setShowDeleteDialog={setShowDeleteDialog}
          ScrollViewRef={ScrollViewRef}
          bubbles={bubbles}
          responseLoading={responseLoading}
        />
        <BottomBar
          setClient={setClient}
          startRecording={startRecording}
          textRef={textRef}
          changeButton={changeButton}
          text={text}
          setText={setText}
          canRecord={canRecord}
          isRecognizing={isRecognizing}
          stopRecording={stopRecording}
        />
      </View>
    </View>
  );
}

export default MainComponent;

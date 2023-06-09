import React, {useState, useRef} from 'react';
import ChatBubble from './ChatBubble';
import {StyleSheet, ScrollView, Image, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';
import Dashboard from './Dashboard';

const loading = require('../assets/typing.gif');

function ResponseContainer(props) {
  const styles = StyleSheet.create({
    viewContainer: {
      marginBottom: 80,
    },
    ResponseContainer: {
      borderTopLeftRadius: 35,
      borderTopRightRadius: 35,
      backgroundColor: '#20282B',
      paddingTop: 7,
    },
    recognitionImage: {
      height: 30,
      width: 30,
    },
    recognitionImageContainer: {
      padding: 5,
      paddingLeft: 10,
      paddingRight: 10,
      borderRadius: 20,
      maxWidth: '100%',
      marginTop: 10,
      marginBottom: 7,
      marginLeft: 15,
      marginRight: 15,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#75A658',
      alignSelf: 'flex-start',
      borderBottomLeftRadius: 0,
    },
    responseImage: {
      height: 200,
      width: 200,
      borderRadius: 15,
    },
    responseImageContainer: {
      borderRadius: 20,
      maxWidth: '100%',
      marginTop: 3,
      marginBottom: 7,
      marginLeft: 15,
      marginRight: 15,
      borderStyle: 'solid',
      borderWidth: 1,
      borderColor: '#75A658',
      alignSelf: 'flex-start',
    },
  });
  return (
    <>
      <ScrollView ref={props.ScrollViewRef} style={styles.ResponseContainer}>
        <View style={styles.viewContainer}>
          {props.bubbles.length < 1 && <Dashboard />}
          {props.bubbles.length > 0 &&
            props.bubbles.map((element, index) => {
              const animation =
                element.role === 'assistant' ? 'fadeInLeft' : 'fadeInRight';
              return (
                <>
                  <Animatable.View
                    animation={animation}
                    duration={300}
                    easing={'ease-in-out'}
                    useNativeDriver={true}
                    key={index}>
                    <ChatBubble bubble={element.content} role={element.role} />
                    {element.imageUrl && (
                      <View style={styles.responseImageContainer}>
                        <Image
                          key={index}
                          style={styles.responseImage}
                          source={{
                            uri: element.imageUrl,
                          }}
                        />
                      </View>
                    )}
                  </Animatable.View>
                </>
              );
            })}
          {props.responseLoading && (
            <Animatable.View
              animation={'fadeInLeft'}
              duration={300}
              easing={'ease-in-out'}
              useNativeDriver={true}
              style={styles.recognitionImageContainer}>
              <FastImage
                source={loading}
                animated={true}
                style={styles.recognitionImage}
                resizeMode={FastImage.resizeMode.contain}
              />
            </Animatable.View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
export default ResponseContainer;

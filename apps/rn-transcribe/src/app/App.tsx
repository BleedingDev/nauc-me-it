import React, { useRef } from 'react'
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native'
import { FileDropper } from '../components/Uploader'

import '../global.css'

export const App = () => {
  const scrollViewRef = useRef<null | ScrollView>(null)

  return (
    <>
      <StatusBar barStyle='dark-content' />
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <ScrollView
          ref={(ref) => {
            scrollViewRef.current = ref
          }}
          contentInsetAdjustmentBehavior='automatic'
          style={styles.scrollView}
        >
          <View style={styles.section}>
            <form className='space-y-4'>
              <FileDropper
                idleMessage="Drag 'n' drop some files here, or click to select files"
                dropZoneMessage='Drop the files here ...'
                className='border max-w-2xl mx-auto'
                inputName='file'
                maxFiles={1}
                accept={{ 'video/*': [], 'audio/*': [] }}
              />
            </form>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#ffffff',
  },
  section: {
    marginVertical: 12,
    marginHorizontal: 12,
  },
})

export default App

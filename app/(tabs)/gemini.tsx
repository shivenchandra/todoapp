import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const API_URL = 'http://localhost:3001/api/chat';

export default function GeminiScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, text: m.text }));
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: '⚠️ Error: ' + (err.message || 'Could not reach server') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gemini AI Chat</Text>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        style={styles.chatList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            <Text style={styles.roleLabel}>{item.role === 'user' ? 'You' : 'Gemini'}</Text>
            <Text style={styles.msgText} selectable>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Send a message to start chatting with Gemini AI</Text>}
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <Text style={styles.loadingText}> Gemini is thinking...</Text>
        </View>
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask Gemini something..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity style={[styles.sendBtn, (loading || !input.trim()) && styles.disabled]} onPress={sendMessage} disabled={loading || !input.trim()}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 12 },
  chatList: { flex: 1 },
  bubble: { marginBottom: 10, padding: 10, borderRadius: 8 },
  userBubble: { backgroundColor: '#DCF8C6', alignSelf: 'flex-end', maxWidth: '80%' },
  aiBubble: { backgroundColor: '#F0F0F0', alignSelf: 'flex-start', maxWidth: '80%' },
  roleLabel: { fontSize: 11, fontWeight: '700', color: '#666', marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 21 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  loadingText: { color: '#666', fontSize: 13 },
  inputRow: { flexDirection: 'row', marginTop: 10, gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 8, fontSize: 16, maxHeight: 80 },
  sendBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, borderRadius: 6, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 60 },
});

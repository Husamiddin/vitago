import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Bot, Send, User, ShieldAlert, Sparkles } from 'lucide-react-native';
import { API_BASE, getSavedToken } from '../services/api';

interface ChatMsg {
  sender: 'ai' | 'user';
  text: string;
}

export default function PharmacyAiScreen() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      sender: 'ai',
      text: 'Assalomu alaykum! Men 24/7 ishlaydigan VitaGo AI Farmatsevtiman. Qanday dori, uning dozasi, ta`siri yoki bir-biriga mosligi haqida savolingiz bor?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const token = await getSavedToken();
      const resp = await fetch(`${API_BASE}/ai/consult`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ query: textToSend }),
      });
      const data = await resp.json();
      const aiReply =
        data.response ||
        data.answer ||
        'Dori bo`yicha ma`lumot tahlil qilindi. Qo`shimcha nojo`ya ta`sirlarni shifokor bilan maslahatlashing.';
      setMessages((prev) => [...prev, { sender: 'ai', text: aiReply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Internet ulanishida uzilish bo`ldi. Iltimos, qayta urinib ko`ring.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.chatScroll}>
        <View style={styles.disclaimer}>
          <ShieldAlert size={16} color="#D97706" />
          <Text style={styles.disclaimerText}>
            AI Farmatsevt ma`lumot berish maqsadida xizmat qiladi. Jiddiy kasalliklarda shifokorga murojaat qiling.
          </Text>
        </View>

        {messages.map((m, i) => (
          <View
            key={i}
            style={[
              styles.msgRow,
              m.sender === 'user' ? styles.msgRowUser : styles.msgRowAi,
            ]}
          >
            {m.sender === 'ai' && (
              <View style={styles.aiAvatar}>
                <Bot size={16} color="#FFFFFF" />
              </View>
            )}
            <View
              style={[
                styles.bubble,
                m.sender === 'user' ? styles.bubbleUser : styles.bubbleAi,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  m.sender === 'user' ? styles.msgTextUser : styles.msgTextAi,
                ]}
              >
                {m.text}
              </Text>
            </View>
          </View>
        ))}

        {loading && (
          <View style={[styles.msgRow, styles.msgRowAi]}>
            <View style={styles.aiAvatar}>
              <Bot size={16} color="#FFFFFF" />
            </View>
            <View style={[styles.bubble, styles.bubbleAi]}>
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick Prompts */}
      <View style={styles.promptRow}>
        {['Analgin bilan Paratsetamol mosmi?', 'Qon bosimi dorisi', 'Vitamin D dozasi'].map(
          (p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.promptChip}
              onPress={() => handleSend(p)}
            >
              <Text style={styles.promptChipText}>{p}</Text>
            </TouchableOpacity>
          )
        )}
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Dori nomi yoki savolingizni yozing..."
          placeholderTextColor="#94A3B8"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          disabled={!input.trim() || loading}
          onPress={() => handleSend()}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  chatScroll: {
    padding: 16,
    paddingBottom: 20,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 14,
    gap: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  disclaimerText: {
    fontSize: 11,
    color: '#92400E',
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  msgRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 8,
  },
  msgRowUser: {
    justifyContent: 'flex-end',
  },
  msgRowAi: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubble: {
    maxWidth: '82%',
    padding: 12,
    borderRadius: 18,
  },
  bubbleUser: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 13,
    lineHeight: 18,
  },
  msgTextUser: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  msgTextAi: {
    color: '#0F172A',
    fontWeight: '500',
  },
  promptRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  promptChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  promptChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0F172A',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
});

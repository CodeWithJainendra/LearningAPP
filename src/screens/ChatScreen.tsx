import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { sendQuestion } from '../services/ApiService';
import { useAppContext } from '../context/AppContext';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  formattedResponse?: any;
  sources?: any[];
  documentsFound?: number;
}

// Helper function to parse and format the response
const parseResponse = (responseText: string) => {
  const sections: any = {
    answer: '',
    keyConcepts: [],
    stepByStep: [],
    formulas: [],
    examples: [],
    additionalNotes: [],
    relatedTopics: []
  };

  const lines = responseText.split('\n');
  let currentSection = 'answer';
  let currentContent = '';

  for (let line of lines) {
    line = line.trim();
    
    if (line.startsWith('## Answer')) {
      currentSection = 'answer';
      continue;
    } else if (line.startsWith('### Key Concepts')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'keyConcepts';
      currentContent = '';
      continue;
    } else if (line.startsWith('### Step-by-Step Explanation')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'stepByStep';
      currentContent = '';
      continue;
    } else if (line.startsWith('### Important Formulas/Definitions')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'formulas';
      currentContent = '';
      continue;
    } else if (line.startsWith('### Example/Application')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'examples';
      currentContent = '';
      continue;
    } else if (line.startsWith('### Additional Notes')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'additionalNotes';
      currentContent = '';
      continue;
    } else if (line.startsWith('### Related Topics')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'relatedTopics';
      currentContent = '';
      continue;
    } else if (line.startsWith('In summary')) {
      if (currentContent) sections[currentSection] = currentContent;
      currentSection = 'summary';
      currentContent = line;
      continue;
    }

    if (line) {
      if (currentSection === 'keyConcepts' && line.startsWith('- **')) {
        // Extract key concepts
        const concept = line.replace('- **', '').replace('**:', '').replace('**', '');
        const description = line.split('**:').pop() || '';
        sections.keyConcepts.push({ concept, description });
      } else if (currentSection === 'stepByStep' && line.match(/^\d+\./)) {
        // Extract step-by-step points
        const step = line.replace(/^\d+\.\s*/, '');
        sections.stepByStep.push(step);
      } else if (currentSection === 'formulas' && line.includes('**')) {
        // Extract formulas/definitions
        const formula = line.replace(/\*\*/g, '');
        sections.formulas.push(formula);
      } else if (currentSection === 'examples' && line.includes('**')) {
        // Extract examples
        const example = line.replace(/\*\*/g, '');
        sections.examples.push(example);
      } else {
        currentContent += line + '\n';
      }
    }
  }

  if (currentContent) {
    sections[currentSection] = currentContent.trim();
  }

  return sections;
};

// Component to render main answer card
const AnswerCard = ({ response, sources, documentsFound, onExpand }: { 
  response: any, 
  sources?: any[], 
  documentsFound?: number,
  onExpand: () => void 
}) => {
  // If no response, return null
  if (!response) {
    return null;
  }

  return (
    <View style={styles.answerCard}>
      {/* Main Answer */}
      {response.answer && (
        <View style={styles.answerSection}>
          <Text style={styles.answerText} numberOfLines={6}>
            {response.answer}
          </Text>
        </View>
      )}

      {/* Key Concepts Preview */}
      {response.keyConcepts && response.keyConcepts.length > 0 && (
        <View style={styles.conceptsPreview}>
          <Text style={styles.sectionTitle}>Key Concepts</Text>
          {response.keyConcepts.slice(0, 2).map((concept: any, index: number) => (
            <View key={index} style={styles.conceptPreviewItem}>
              <Text style={styles.conceptTitle}>{concept.concept}</Text>
            </View>
          ))}
          {response.keyConcepts.length > 2 && (
            <Text style={styles.moreText}>+{response.keyConcepts.length - 2} more concepts</Text>
          )}
        </View>
      )}

      {/* Examples Preview */}
      {response.examples && response.examples.length > 0 && (
        <View style={styles.examplesPreview}>
          <Text style={styles.sectionTitle}>Examples</Text>
          <View style={styles.examplePreviewItem}>
            <Text style={styles.exampleText} numberOfLines={2}>
              {response.examples[0]}
            </Text>
          </View>
          {response.examples.length > 1 && (
            <Text style={styles.moreText}>+{response.examples.length - 1} more examples</Text>
          )}
        </View>
      )}

      {/* Expand Button */}
      <TouchableOpacity style={styles.expandButton} onPress={onExpand}>
        <Text style={styles.expandText}>Click to expand</Text>
        <Ionicons name="expand" size={12} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );
};

// Component to render source cards
const SourceCards = ({ sources, documentsFound }: { sources?: any[], documentsFound?: number }) => {
  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <View style={styles.sourcesContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {sources.map((source: any, index: number) => (
          <TouchableOpacity
            key={`source-${index}`}
            style={styles.sourceCard}
            onPress={() => {
              setSelectedSource(source);
              setShowSourceModal(true);
            }}
          >
            <Text style={styles.sourceNumber}>{index + 1}</Text>
            <Text style={styles.sourceTitle} numberOfLines={1}>
              {(source.source || 'Source').length > 8 ?
                (source.source || 'Source').substring(0, 8) + '...' :
                (source.source || 'Source')
              }
            </Text>
            <Text style={styles.sourcePage}>P.{source.page_number || source.page || 'N/A'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      {documentsFound && (
        <Text style={styles.documentsInfo}>📊 {documentsFound} documents found</Text>
      )}

      {/* Source Detail Modal */}
      <Modal visible={showSourceModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.sourceModalContent}>
            <View style={styles.sourceModalHeader}>
              <Text style={styles.sourceModalTitle}>
                {selectedSource?.source || 'Source Details'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSourceModal(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.sourceModalBody}>
              <Text style={styles.sourceModalPage}>
                📄 Page {selectedSource?.page_number || selectedSource?.page || 'N/A'}
              </Text>
              {selectedSource?.snippet && (
                <View style={styles.snippetContainer}>
                  <Text style={styles.snippetLabel}>Content:</Text>
                  <Text style={styles.snippetText}>
                    {selectedSource.snippet
                      .replace(/\{.*?\}/g, '')
                      .replace(/\n+/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim()}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Full Screen Answer Modal
const FullAnswerModal = ({ visible, response, onClose }: { 
  visible: boolean, 
  response: any, 
  onClose: () => void 
}) => {
  // If no response or modal not visible, return null
  if (!visible || !response) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View style={styles.fullScreenModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalHeaderTitle}>Complete Answer</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {/* Main Answer */}
          {response.answer && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Answer</Text>
              <Text style={styles.fullAnswerText}>{response.answer}</Text>
            </View>
          )}

          {/* Key Concepts */}
          {response.keyConcepts && response.keyConcepts.length > 0 && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Key Concepts</Text>
              {response.keyConcepts.map((concept: any, index: number) => (
                <View key={index} style={styles.fullConceptItem}>
                  <Text style={styles.fullConceptTitle}>{concept.concept}</Text>
                  <Text style={styles.fullConceptDescription}>{concept.description}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Step by Step */}
          {response.stepByStep && response.stepByStep.length > 0 && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Step-by-Step Explanation</Text>
              {response.stepByStep.map((step: string, index: number) => (
                <View key={index} style={styles.fullStepItem}>
                  <Text style={styles.fullStepNumber}>{index + 1}.</Text>
                  <Text style={styles.fullStepText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Formulas */}
          {response.formulas && response.formulas.length > 0 && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Important Formulas & Definitions</Text>
              {response.formulas.map((formula: string, index: number) => (
                <View key={index} style={styles.fullFormulaItem}>
                  <Text style={styles.fullFormulaText}>{formula}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Examples */}
          {response.examples && response.examples.length > 0 && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Examples & Applications</Text>
              {response.examples.map((example: string, index: number) => (
                <View key={index} style={styles.fullExampleItem}>
                  <Text style={styles.fullExampleText}>{example}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Additional Notes */}
          {response.additionalNotes && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Additional Notes</Text>
              <Text style={styles.fullNotesText}>{response.additionalNotes}</Text>
            </View>
          )}

          {/* Summary */}
          {response.summary && (
            <View style={styles.fullSection}>
              <Text style={styles.fullSectionTitle}>Summary</Text>
              <Text style={styles.fullSummaryText}>{response.summary}</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default function ChatScreen() {
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation();
  const { subject, class: classNumber, chapter } = route.params;
  const { dispatch } = useAppContext();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm your learning assistant for Class ${classNumber} ${subject} - ${chapter}. Ask me any questions!`,
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showFullAnswer, setShowFullAnswer] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const questionText = inputText.trim();
    
    // Add user message
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: questionText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputText('');

    // Scroll to show user message immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    dispatch({ type: 'INCREMENT_QUESTIONS_ASKED' });

    try {
      // Call the real API
      const response = await sendQuestion({
        question: questionText,
        subject: subject,
        class: classNumber,
        chapter: chapter,
      });

      console.log('API Response:', response);

      // Extract the answer from the response
      const answerText = response.answer || 'Sorry, I couldn\'t process your question. Please try again.';

      // Parse the response for better formatting
      const formattedResponse = parseResponse(answerText);

      // Add bot message
      const botMessage: Message = {
        id: `${Date.now()}-bot`,
        text: answerText,
        isUser: false,
        timestamp: new Date(),
        formattedResponse: formattedResponse,
        sources: response.sources,
        documentsFound: response.documents_found,
      };

      setMessages(prev => [...prev, botMessage]);

      // Scroll to show bot message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    } catch (error) {
      console.error('Error in sendMessage:', error);
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        text: 'Sorry, there was an error processing your question. Please check your internet connection and try again.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <View style={[
        styles.messageContainer,
        item.isUser ? styles.userMessage : styles.botMessage
      ]}>
        <View style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble
        ]}>
          {item.isUser ? (
            <Text style={[styles.messageText, styles.userText]}>
              {item.text}
            </Text>
          ) : (
            // Check if this is a formatted response (API response) or simple text (welcome/error message)
            item.formattedResponse && item.formattedResponse.answer ? (
              <View style={styles.botMessageContent}>
                <AnswerCard 
                  response={item.formattedResponse} 
                  sources={item.sources}
                  documentsFound={item.documentsFound}
                  onExpand={() => {
                    if (item.formattedResponse && item.formattedResponse.answer) {
                      setCurrentResponse(item.formattedResponse);
                      setShowFullAnswer(true);
                    }
                  }}
                />
                <SourceCards 
                  sources={item.sources}
                  documentsFound={item.documentsFound}
                />
              </View>
            ) : (
              <Text style={[styles.messageText, { color: '#333' }]}>
                {item.text}
              </Text>
            )
          )}
          <Text style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.botTimestamp
          ]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subject} - Class {classNumber}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={true}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          ) : null
        }
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={`Ask me about ${chapter}...`}
          placeholderTextColor="#999"
          multiline
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Ionicons
            name="send"
            size={20}
            color={(!inputText.trim() || isLoading) ? '#ccc' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Full Answer Modal */}
      <FullAnswerModal 
        visible={showFullAnswer}
        response={currentResponse}
        onClose={() => setShowFullAnswer(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSpacer: {
    width: 40,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  botMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '90%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: 'white',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  botTimestamp: {
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    marginHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: 'white',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  // Bot Message Content
  botMessageContent: {
    width: '100%',
  },
  // Answer Card Styles
  answerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  answerSection: {
    marginBottom: 12,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
  },
  conceptsPreview: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  conceptPreviewItem: {
    backgroundColor: '#e3f2fd',
    padding: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  conceptTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  examplesPreview: {
    marginBottom: 12,
  },
  examplePreviewItem: {
    backgroundColor: '#e8f5e8',
    padding: 8,
    borderRadius: 6,
  },
  exampleText: {
    fontSize: 12,
    color: '#2e7d32',
  },
  moreText: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  expandText: {
    fontSize: 11,
    color: '#007AFF',
    marginRight: 4,
  },
  // Source Cards Styles
  sourcesContainer: {
    marginTop: 8,
  },
  sourceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 6,
    minWidth: 45,
    maxWidth: 55,
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sourceNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 1,
  },
  sourceTitle: {
    fontSize: 7,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 1,
    fontWeight: '500',
    lineHeight: 8,
  },
  sourcePage: {
    fontSize: 6,
    color: '#94a3b8',
    textAlign: 'center',
    fontWeight: '500',
  },
  documentsInfo: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sourceModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  sourceModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  sourceModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  sourceModalBody: {
    padding: 20,
  },
  sourceModalPage: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 16,
  },
  snippetContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  snippetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  snippetText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4b5563',
  },
  // Full Screen Modal Styles
  fullScreenModal: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a202c',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  fullSection: {
    marginBottom: 24,
  },
  fullSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  fullAnswerText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  fullConceptItem: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  fullConceptTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 6,
  },
  fullConceptDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  fullStepItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  fullStepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 12,
    minWidth: 24,
  },
  fullStepText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    flex: 1,
  },
  fullFormulaItem: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  fullFormulaText: {
    fontSize: 15,
    color: '#856404',
    fontWeight: '500',
    lineHeight: 22,
  },
  fullExampleItem: {
    backgroundColor: '#d1ecf1',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bee5eb',
  },
  fullExampleText: {
    fontSize: 15,
    color: '#0c5460',
    lineHeight: 22,
  },
  fullNotesText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  fullSummaryText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    fontWeight: '500',
  },
});

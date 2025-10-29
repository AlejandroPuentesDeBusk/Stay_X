import React from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TextInput
        style={[styles.search, { borderColor: theme.primary, color: theme.text }]}
        placeholder="Search by area, type, or location..."
        placeholderTextColor="#aaa"
      />

      <ScrollView>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Explore by type</Text>

        <View style={styles.categoryContainer}>
          {['Houses', 'Apartments', 'Buildings', 'Insurance (Women)'].map((item, index) => (
            <TouchableOpacity key={index} style={[styles.categoryButton, { borderColor: theme.primary }]}>
              <Text style={{ color: theme.text }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  search: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  categoryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
});

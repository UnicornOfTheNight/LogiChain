import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import type { AlertDTO } from '../types/dtos';

interface Props {
  alert: AlertDTO;
}

export default function AlertBanner({ alert }: Props) {
  return (
    <View style={styles.banner}>
      <Text style={styles.title}>Alerte : {alert.label}</Text>
      {alert.note ? <Text style={styles.note}>{alert.note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fff3cd',
    borderLeftWidth: 4,
    borderLeftColor: '#f9a825',
    padding: 10,
    marginVertical: 4,
    borderRadius: 4
  },
  title: { fontWeight: '700', color: '#7a5b00' },
  note: { color: '#7a5b00', marginTop: 2 }
});

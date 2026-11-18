import { Text, View } from '@react-pdf/renderer';
import styles from './pdfStyles';
import { parseDescription } from './textUtils';

export const Description = ({ text }: { text?: string }) => (
  <>
    {parseDescription(text).map((block) => {
      if (block.kind === 'subheading') {
        return (
          <Text key={block.line} style={styles.subHeading}>
            {block.text}
          </Text>
        );
      }
      if (block.kind === 'item') {
        return (
          <View key={block.line} style={styles.subItem}>
            <Text style={styles.subItemMarker}>•</Text>
            <Text style={styles.subItemText}>{block.text}</Text>
          </View>
        );
      }
      return (
        <Text key={block.line} style={styles.bulletItem}>
          {block.text}
        </Text>
      );
    })}
  </>
);

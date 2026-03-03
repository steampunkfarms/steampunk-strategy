import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, renderToBuffer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 60,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.4,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1a365d',
    paddingBottom: 12,
  },
  orgName: {
    fontSize: 16,
    fontFamily: 'Times-Bold',
    color: '#1a365d',
    marginBottom: 2,
  },
  orgSubtitle: {
    fontSize: 9,
    color: '#4a5568',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: 'Times-Bold',
    textAlign: 'center',
    marginBottom: 4,
    marginTop: 16,
  },
  subtitle: {
    fontSize: 10,
    textAlign: 'center',
    color: '#4a5568',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e0',
    paddingBottom: 2,
  },
  paragraph: {
    marginBottom: 8,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  italic: {
    fontFamily: 'Times-Italic',
  },
  motionBlock: {
    marginLeft: 20,
    marginBottom: 8,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#1a365d',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 4,
    paddingLeft: 12,
  },
  listBullet: {
    width: 15,
    fontFamily: 'Times-Bold',
  },
  listContent: {
    flex: 1,
  },
  signatureBlock: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: '#1a365d',
    paddingTop: 16,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    width: 250,
    marginBottom: 4,
    marginTop: 30,
  },
  signatureImage: {
    width: 180,
    height: 60,
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 9,
    color: '#4a5568',
  },
  attestation: {
    fontSize: 9,
    fontFamily: 'Times-Italic',
    color: '#4a5568',
    marginTop: 12,
    textAlign: 'justify',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: 'center',
    fontSize: 8,
    color: '#718096',
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 6,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 60,
    fontSize: 8,
    color: '#718096',
  },
});

interface MinutesPdfData {
  date: string;
  type: string;
  location: string;
  polishedMinutes: string;
  attestedBy?: string | null;
  attestedRole?: string | null;
  attestedDate?: string | null;
  attestationText?: string | null;
  signatureBlobUrl?: string | null;
}

function parseMinutesToSections(markdown: string): Array<{ type: 'heading' | 'paragraph' | 'motion' | 'list-item'; text: string }> {
  const sections: Array<{ type: 'heading' | 'paragraph' | 'motion' | 'list-item'; text: string }> = [];
  const lines = markdown.split('\n');

  let currentParagraph = '';

  const flushParagraph = () => {
    if (currentParagraph.trim()) {
      sections.push({ type: 'paragraph', text: currentParagraph.trim() });
      currentParagraph = '';
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip horizontal rules
    if (trimmed === '---' || trimmed === '***') continue;

    // Headings
    if (trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
      flushParagraph();
      sections.push({ type: 'heading', text: trimmed.replace(/^#+\s*/, '') });
      continue;
    }

    // Motion blocks (bold MOTION:)
    if (trimmed.startsWith('**MOTION:') || trimmed.startsWith('**MOTION**:')) {
      flushParagraph();
      sections.push({ type: 'motion', text: trimmed.replace(/\*\*/g, '') });
      continue;
    }

    // List items
    if (/^\d+\.\s/.test(trimmed) || trimmed.startsWith('- ')) {
      flushParagraph();
      sections.push({ type: 'list-item', text: trimmed.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '') });
      continue;
    }

    // Empty lines flush paragraphs
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Everything else is paragraph text
    currentParagraph += (currentParagraph ? ' ' : '') + trimmed;
  }

  flushParagraph();
  return sections;
}

function stripBold(text: string): string {
  return text.replace(/\*\*/g, '');
}

function MeetingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    regular: 'REGULAR',
    special: 'SPECIAL',
    annual: 'ANNUAL',
    emergency: 'EMERGENCY',
  };
  return labels[type] || type.toUpperCase();
}

function MinutesPdf({ data }: { data: MinutesPdfData }) {
  const sections = parseMinutesToSections(data.polishedMinutes);
  const meetingDate = new Date(data.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header / Letterhead */}
        <View style={styles.header}>
          <Text style={styles.orgName}>STEAMPUNK FARMS RESCUE BARN INC.</Text>
          <Text style={styles.orgSubtitle}>A California 501(c)(3) Nonprofit Corporation</Text>
          <Text style={styles.orgSubtitle}>EIN: 82-4897930</Text>
        </View>

        {/* Meeting Title */}
        <Text style={styles.title}>
          MINUTES OF {MeetingTypeLabel(data.type)} MEETING OF THE BOARD OF DIRECTORS
        </Text>
        <Text style={styles.subtitle}>
          {meetingDate} — {data.location}
        </Text>

        {/* Polished Minutes Body */}
        {sections.map((section, i) => {
          if (section.type === 'heading') {
            return <Text key={i} style={styles.sectionHeading}>{section.text}</Text>;
          }
          if (section.type === 'motion') {
            return (
              <View key={i} style={styles.motionBlock}>
                <Text style={styles.paragraph}>{stripBold(section.text)}</Text>
              </View>
            );
          }
          if (section.type === 'list-item') {
            return (
              <View key={i} style={styles.listItem}>
                <Text style={styles.listBullet}>•</Text>
                <Text style={styles.listContent}>{stripBold(section.text)}</Text>
              </View>
            );
          }
          return <Text key={i} style={styles.paragraph}>{stripBold(section.text)}</Text>;
        })}

        {/* Signature Block */}
        {data.attestedBy && (
          <View style={styles.signatureBlock}>
            <Text style={styles.bold}>Attested and Signed:</Text>

            {data.signatureBlobUrl && (
              <Image src={data.signatureBlobUrl} style={styles.signatureImage} />
            )}
            {!data.signatureBlobUrl && <View style={styles.signatureLine} />}

            <Text>{data.attestedBy}, {data.attestedRole}</Text>
            <Text style={styles.signatureLabel}>
              Date: {data.attestedDate ? new Date(data.attestedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </Text>

            {data.attestationText && (
              <Text style={styles.attestation}>{data.attestationText}</Text>
            )}
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Official Board Minutes — Steampunk Farms Rescue Barn Inc. — EIN: 82-4897930 — Signed via attested digital process
        </Text>
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

export async function generateMinutesPdf(data: MinutesPdfData): Promise<Buffer> {
  const buffer = await renderToBuffer(<MinutesPdf data={data} />);
  return Buffer.from(buffer);
}

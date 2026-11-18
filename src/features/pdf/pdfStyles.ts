import { StyleSheet } from '@react-pdf/renderer';

export const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
    padding: 40,
  },

  sidebar: {
    display: 'none',
  },

  sidebarContent: {
    display: 'none',
  },

  mainContent: {
    width: '100%',
    flexDirection: 'column',
  },

  sidebarName: {
    display: 'none',
  },
  sidebarSection: {
    display: 'none',
  },
  sidebarTitle: {
    display: 'none',
  },
  sidebarText: {
    display: 'none',
  },
  sidebarLink: {
    display: 'none',
  },
  header: {
    marginBottom: 12,
    textAlign: 'center',
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 6,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  headerInfo: {
    fontSize: 9,
    color: '#444444',
    lineHeight: 1.8,
    marginTop: 6,
  },
  linksContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  linkText: {
    fontSize: 9,
    color: '#1d4ed8',
    marginRight: 12,
  },
  socialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 10,
    marginRight: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 14,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 4,
  },
  sectionContent: {
    marginBottom: 8,
  },
  sectionBody: {
    marginLeft: 0,
    marginTop: 4,
  },
  itemContainer: {
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 9,
    color: '#333333',
    fontStyle: 'italic',
    marginBottom: 2,
    marginLeft: 0,
  },
  bodyText: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 2,
    marginLeft: 0,
  },
  subHeading: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
    marginLeft: 0,
  },
  itemDate: {
    fontSize: 9,
    color: '#555555',
    marginBottom: 6,
    marginLeft: 0,
  },
  bulletList: {
    marginLeft: 0,
    marginTop: 6,
  },
  bulletItem: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 3,
    lineHeight: 1.4,
  },
  objective: {
    fontSize: 9,
    color: '#333333',
    lineHeight: 1.5,
    textAlign: 'justify',
  },
  skillItem: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 3,
    lineHeight: 1.4,
  },
});

export default pdfStyles;

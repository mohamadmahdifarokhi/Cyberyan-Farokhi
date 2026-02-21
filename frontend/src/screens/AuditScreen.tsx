import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { AuditLog } from '../types';
import { ModernCard } from '../components/ModernCard';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';

interface AuditScreenProps {
  navigation?: unknown;
}
const ITEMS_PER_PAGE = 10;

type StylesType = ReturnType<typeof createStyles>;
const AuditLogItem: React.FC<{
  item: AuditLog;
  index: number;
  formatTimestamp: (timestamp: string) => string;
  styles: StylesType;
}> = ({ item, index, formatTimestamp, styles }) => {
  const [cardAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 300,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, [cardAnim, index]);

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [
          {
            translateY: cardAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            }),
          },
        ],
      }}
    >
      <ModernCard elevation="md" style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.operationBadge}>
            <Text style={styles.operationText}>{item.operation}</Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        <View style={styles.hashContainer}>
          <Text style={styles.hashLabel}>SHA-256 Hash</Text>
          <View style={styles.hashBox}>
            <Text style={styles.hashValue} numberOfLines={2} ellipsizeMode="middle">
              {item.hash}
            </Text>
          </View>
        </View>
      </ModernCard>
    </Animated.View>
  );
};

export const AuditScreen: React.FC<AuditScreenProps> = () => {
  const { auditLogs } = useAppContext();
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [fadeAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);

    return date.toLocaleDateString();
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setCurrentPage(1);
    setIsRefreshing(false);
  };
  const filterLogs = (): AuditLog[] => {
    let filtered = [...auditLogs];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();

      filtered = filtered.filter(
        (log) => log.operation.toLowerCase().includes(query) || log.hash.toLowerCase().includes(query),
      );
    }
    if (dateFilter.trim()) {
      filtered = filtered.filter((log) => {
        const logDate = formatDate(log.timestamp);

        return logDate.includes(dateFilter);
      });
    }
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  };
  const getPaginatedLogs = (): AuditLog[] => {
    const filtered = filterLogs();

    return filtered.slice(0, currentPage * ITEMS_PER_PAGE);
  };
  const handleLoadMore = () => {
    const filtered = filterLogs();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    if (currentPage < totalPages && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setCurrentPage((prev) => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  };
  const paginatedLogs = getPaginatedLogs();
  const filteredLogs = filterLogs();
  const hasMore = paginatedLogs.length < filteredLogs.length;
  const renderAuditLog = ({ item, index }: { item: AuditLog; index: number }) => {
    return <AuditLogItem item={item} index={index} formatTimestamp={formatTimestamp} styles={styles} />;
  };
  const renderHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.header}>
        <Text style={styles.title}>Audit Logs</Text>
        <Text style={styles.subtitle}>
          {filteredLogs.length} {filteredLogs.length === 1 ? 'entry' : 'entries'}
        </Text>
      </View>
      {}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by operation or hash..."
          placeholderTextColor={theme.colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {}
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Filter by date (e.g., 12/25/2024)..."
          placeholderTextColor={theme.colors.text.secondary}
          value={dateFilter}
          onChangeText={setDateFilter}
        />
        {dateFilter.length > 0 && (
          <TouchableOpacity onPress={() => setDateFilter('')} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
  const renderFooter = () => {
    if (!hasMore) return null;

    return (
      <View style={styles.footerContainer}>
        {isLoadingMore ? (
          <ActivityIndicator size="small" color={theme.colors.primary.solid} />
        ) : (
          <TouchableOpacity style={styles.loadMoreButton} onPress={handleLoadMore}>
            <Text style={styles.loadMoreText}>Load More</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  const renderEmpty = () => (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>
        {searchQuery || dateFilter ? 'No logs match your filters' : 'No audit logs available'}
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery || dateFilter
          ? 'Try adjusting your search or filters'
          : 'Audit logs will appear here after registration'}
      </Text>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={paginatedLogs}
        renderItem={renderAuditLog}
        keyExtractor={(item, index) => `${item.hash}-${index}`}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        contentContainerStyle={paginatedLogs.length === 0 ? styles.emptyListContainer : styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.solid} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
};
const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    header: {
      padding: responsive.spacing.lg,
      paddingTop: responsive.spacing.xl,
    },
    title: {
      fontSize: responsive.fontSize('2xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.xs,
    },
    subtitle: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
    },
    searchContainer: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.md,
      position: 'relative',
    },
    searchInput: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.lg,
      padding: responsive.spacing.md,
      paddingRight: responsive.spacing['2xl'],
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.primary,
      minHeight: responsive.touchTarget,
      ...theme.shadows.sm,
    },
    filterContainer: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.lg,
      position: 'relative',
    },
    filterInput: {
      backgroundColor: theme.colors.surface.primary,
      borderRadius: theme.borderRadius.lg,
      padding: responsive.spacing.md,
      paddingRight: responsive.spacing['2xl'],
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.primary,
      minHeight: responsive.touchTarget,
      ...theme.shadows.sm,
    },
    clearButton: {
      position: 'absolute',
      right: responsive.spacing.md,
      top: '50%',
      transform: [{ translateY: -12 }],
      width: responsive.touchTarget,
      height: responsive.touchTarget,
      borderRadius: responsive.touchTarget / 2,
      backgroundColor: theme.colors.text.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearButtonText: {
      color: theme.colors.surface.primary,
      fontSize: 14,
      fontWeight: theme.typography.fontWeight.bold,
    },
    listContainer: {
      paddingHorizontal: responsive.spacing.lg,
      paddingBottom: responsive.spacing.xl,
    },
    emptyListContainer: {
      flexGrow: 1,
    },
    logCard: {
      marginBottom: responsive.spacing.md,
    },
    logHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: responsive.spacing.md,
    },
    operationBadge: {
      backgroundColor: theme.colors.primary.solid,
      paddingHorizontal: responsive.spacing.md,
      paddingVertical: responsive.spacing.xs,
      borderRadius: theme.borderRadius.full,
      flex: 1,
      marginRight: responsive.spacing.md,
      minHeight: responsive.touchTarget,
      justifyContent: 'center',
    },
    operationText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    timestamp: {
      fontSize: responsive.fontSize('xs'),
      color: theme.colors.text.secondary,
      textAlign: 'right',
    },
    hashContainer: {
      marginTop: responsive.spacing.sm,
    },
    hashLabel: {
      fontSize: responsive.fontSize('xs'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.xs,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    hashBox: {
      backgroundColor: theme.colors.background.primary,
      padding: responsive.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.primary,
    },
    hashValue: {
      fontSize: responsive.fontSize('xs'),
      fontFamily: theme.typography.fontFamily.mono,
      color: theme.colors.primary.solid,
      lineHeight: responsive.fontSize('xs') * 1.5,
    },
    footerContainer: {
      paddingVertical: responsive.spacing.lg,
      alignItems: 'center',
    },
    loadMoreButton: {
      backgroundColor: theme.colors.primary.solid,
      paddingHorizontal: responsive.spacing.xl,
      paddingVertical: responsive.spacing.md,
      borderRadius: theme.borderRadius.full,
      minHeight: responsive.touchTarget,
      ...theme.shadows.sm,
    },
    loadMoreText: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: responsive.spacing.xl,
    },
    emptyIcon: {
      fontSize: 64,
      marginBottom: responsive.spacing.lg,
    },
    emptyText: {
      fontSize: responsive.fontSize('lg'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      textAlign: 'center',
      marginBottom: responsive.spacing.sm,
    },
    emptySubtext: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
      textAlign: 'center',
    },
  });

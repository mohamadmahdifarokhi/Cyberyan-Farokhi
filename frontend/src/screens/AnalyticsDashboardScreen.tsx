import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { ModernCard } from '../components/ModernCard';
import { useTheme } from '../hooks/useTheme';
import { useResponsive } from '../hooks/useResponsive';
import { apiService } from '../services/api';
import { AnalyticsMetrics, SystemHealth, HealthStatus } from '../types';

interface AnalyticsDashboardScreenProps {
  navigation?: unknown;
}

export const AnalyticsDashboardScreen: React.FC<AnalyticsDashboardScreenProps> = () => {
  const theme = useTheme();
  const responsive = useResponsive();
  const styles = React.useMemo(() => createStyles(theme, responsive), [theme, responsive]);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchData = async () => {
    try {
      setError(null);
      const [analyticsData, healthData] = await Promise.all([apiService.getAnalytics(), apiService.getSystemHealth()]);

      setMetrics(analyticsData);
      setSystemHealth(healthData);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error('Error fetching analytics:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };
  const getHealthColor = (status: HealthStatus): string => {
    switch (status) {
      case 'healthy':
        return theme.colors.success;
      case 'degraded':
        return theme.colors.warning;
      case 'down':
        return theme.colors.error;
      default:
        return theme.colors.text.disabled;
    }
  };
  const getHealthIcon = (status: HealthStatus): string => {
    switch (status) {
      case 'healthy':
        return '✓';
      case 'degraded':
        return '⚠';
      case 'down':
        return '✕';
      default:
        return '?';
    }
  };
  const renderChart = () => {
    if (!metrics || !metrics.registrationTrend || metrics.registrationTrend.length === 0) {
      return (
        <View style={styles.emptyChart}>
          <Text style={styles.emptyChartText}>No trend data available</Text>
        </View>
      );
    }
    const maxCount = Math.max(...metrics.registrationTrend.map((d) => d.count), 1);
    const chartWidth = Dimensions.get('window').width - responsive.spacing.lg * 4;
    const barWidth = Math.max(chartWidth / metrics.registrationTrend.length - responsive.spacing.sm, 20);

    return (
      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {metrics.registrationTrend.map((data, index) => {
            const barHeight = (data.count / maxCount) * 150;
            const date = new Date(data.date);
            const label = `${date.getMonth() + 1}/${date.getDate()}`;

            return (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight || 2,
                        width: barWidth,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{label}</Text>
                <Text style={styles.barValue}>{data.count}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary.solid} />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }
  if (error && !metrics) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Text style={styles.errorSubtext}>Pull down to retry</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary.solid} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Dashboard</Text>
        <Text style={styles.subtitle}>System Metrics & Performance</Text>
      </View>
      {}
      <View style={styles.metricsGrid}>
        <ModernCard elevation="md" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Total Registrations</Text>
          <Text style={styles.metricValue}>{metrics?.totalRegistrations || 0}</Text>
          <Text style={styles.metricSubtext}>All time</Text>
        </ModernCard>
        <ModernCard elevation="md" style={styles.metricCard}>
          <Text style={styles.metricLabel}>Avg Processing Time</Text>
          <Text style={styles.metricValue}>
            {metrics?.averageProcessingTime ? `${metrics.averageProcessingTime.toFixed(0)}ms` : '0ms'}
          </Text>
          <Text style={styles.metricSubtext}>Per registration</Text>
        </ModernCard>
      </View>
      {}
      <ModernCard elevation="lg" style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Registration Trend</Text>
        <Text style={styles.sectionSubtitle}>Daily registrations over time</Text>
        {renderChart()}
      </ModernCard>
      {}
      <ModernCard elevation="lg" style={styles.healthCard}>
        <Text style={styles.sectionTitle}>System Health</Text>
        <Text style={styles.sectionSubtitle}>Service status indicators</Text>
        {systemHealth ? (
          <View style={styles.healthGrid}>
            <View style={styles.healthItem}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth.services.api) }]}>
                  <Text style={styles.healthIcon}>{getHealthIcon(systemHealth.services.api)}</Text>
                </View>
                <Text style={styles.healthLabel}>API</Text>
              </View>
              <Text style={[styles.healthStatus, { color: getHealthColor(systemHealth.services.api) }]}>
                {systemHealth.services.api}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <View style={styles.healthHeader}>
                <View
                  style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth.services.mongodb) }]}
                >
                  <Text style={styles.healthIcon}>{getHealthIcon(systemHealth.services.mongodb)}</Text>
                </View>
                <Text style={styles.healthLabel}>MongoDB</Text>
              </View>
              <Text style={[styles.healthStatus, { color: getHealthColor(systemHealth.services.mongodb) }]}>
                {systemHealth.services.mongodb}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <View style={styles.healthHeader}>
                <View
                  style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth.services.rabbitmq) }]}
                >
                  <Text style={styles.healthIcon}>{getHealthIcon(systemHealth.services.rabbitmq)}</Text>
                </View>
                <Text style={styles.healthLabel}>RabbitMQ</Text>
              </View>
              <Text style={[styles.healthStatus, { color: getHealthColor(systemHealth.services.rabbitmq) }]}>
                {systemHealth.services.rabbitmq}
              </Text>
            </View>
            <View style={styles.healthItem}>
              <View style={styles.healthHeader}>
                <View style={[styles.healthIndicator, { backgroundColor: getHealthColor(systemHealth.status) }]}>
                  <Text style={styles.healthIcon}>{getHealthIcon(systemHealth.status)}</Text>
                </View>
                <Text style={styles.healthLabel}>Overall</Text>
              </View>
              <Text style={[styles.healthStatus, { color: getHealthColor(systemHealth.status) }]}>
                {systemHealth.status}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.healthLoading}>
            <ActivityIndicator size="small" color={theme.colors.primary.solid} />
            <Text style={styles.healthLoadingText}>Loading health status...</Text>
          </View>
        )}
        {systemHealth?.uptime && (
          <View style={styles.uptimeContainer}>
            <Text style={styles.uptimeLabel}>System Uptime</Text>
            <Text style={styles.uptimeValue}>
              {Math.floor(systemHealth.uptime / 3600)}h {Math.floor((systemHealth.uptime % 3600) / 60)}m
            </Text>
          </View>
        )}
      </ModernCard>
    </ScrollView>
  );
};
const createStyles = (theme: ReturnType<typeof useTheme>, responsive: ReturnType<typeof useResponsive>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background.primary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
    },
    loadingText: {
      marginTop: responsive.spacing.md,
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background.primary,
      padding: responsive.spacing.xl,
    },
    errorText: {
      fontSize: responsive.fontSize('lg'),
      color: theme.colors.error,
      textAlign: 'center',
      marginBottom: responsive.spacing.sm,
    },
    errorSubtext: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.secondary,
      textAlign: 'center',
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
    metricsGrid: {
      flexDirection: 'row',
      paddingHorizontal: responsive.spacing.lg,
      gap: responsive.spacing.md,
      marginBottom: responsive.spacing.lg,
    },
    metricCard: {
      flex: 1,
      padding: responsive.spacing.lg,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.sm,
      textAlign: 'center',
    },
    metricValue: {
      fontSize: responsive.fontSize('3xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary.solid,
      marginBottom: responsive.spacing.xs,
    },
    metricSubtext: {
      fontSize: responsive.fontSize('xs'),
      color: theme.colors.text.disabled,
    },
    chartCard: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.lg,
      padding: responsive.spacing.lg,
    },
    sectionTitle: {
      fontSize: responsive.fontSize('xl'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: responsive.spacing.xs,
    },
    sectionSubtitle: {
      fontSize: responsive.fontSize('sm'),
      color: theme.colors.text.secondary,
      marginBottom: responsive.spacing.lg,
    },
    chartContainer: {
      marginTop: responsive.spacing.md,
    },
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-around',
      height: 200,
      paddingBottom: responsive.spacing.xl,
    },
    barContainer: {
      alignItems: 'center',
      flex: 1,
    },
    barWrapper: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      width: '100%',
    },
    bar: {
      backgroundColor: theme.colors.primary.solid,
      borderTopLeftRadius: theme.borderRadius.sm,
      borderTopRightRadius: theme.borderRadius.sm,
      minHeight: 2,
    },
    barLabel: {
      fontSize: responsive.fontSize('xs'),
      color: theme.colors.text.secondary,
      marginTop: responsive.spacing.xs,
    },
    barValue: {
      fontSize: responsive.fontSize('xs'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
      marginTop: 2,
    },
    emptyChart: {
      height: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyChartText: {
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
    },
    healthCard: {
      marginHorizontal: responsive.spacing.lg,
      marginBottom: responsive.spacing.xl,
      padding: responsive.spacing.lg,
    },
    healthGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: responsive.spacing.md,
      marginTop: responsive.spacing.md,
    },
    healthItem: {
      flex: 1,
      minWidth: '45%',
      backgroundColor: theme.colors.background.primary,
      padding: responsive.spacing.md,
      borderRadius: theme.borderRadius.md,
    },
    healthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: responsive.spacing.sm,
    },
    healthIndicator: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: responsive.spacing.sm,
    },
    healthIcon: {
      color: theme.colors.text.inverse,
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.bold,
    },
    healthLabel: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.primary,
    },
    healthStatus: {
      fontSize: responsive.fontSize('sm'),
      fontWeight: theme.typography.fontWeight.semibold,
      textTransform: 'capitalize',
      marginLeft: responsive.spacing.xl + responsive.spacing.sm,
    },
    healthLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: responsive.spacing.xl,
    },
    healthLoadingText: {
      marginLeft: responsive.spacing.md,
      fontSize: responsive.fontSize('base'),
      color: theme.colors.text.secondary,
    },
    uptimeContainer: {
      marginTop: responsive.spacing.lg,
      paddingTop: responsive.spacing.lg,
      borderTopWidth: 1,
      borderTopColor: theme.colors.divider,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    uptimeLabel: {
      fontSize: responsive.fontSize('base'),
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.text.secondary,
    },
    uptimeValue: {
      fontSize: responsive.fontSize('lg'),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.primary.solid,
    },
  });

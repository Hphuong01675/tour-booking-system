/**
 * Participant Search Service
 * Advanced search with scoring, multi-criteria filtering, and branching logic
 * Purpose: Support white-box testing with ~20 decision nodes
 */

class ParticipantSearchService {
  /**
   * Calculate relevance score for a participant based on search term
   * This creates multiple branching paths for test coverage
   */
  static calculateSearchScore(participant, booking, searchTerm) {
    if (!searchTerm || searchTerm.length === 0) {
      return { score: 100, matched: false, reason: 'NO_SEARCH_TERM' };
    }

    const term = searchTerm.toLowerCase().trim();
    const fullName = String(participant.fullName || '').toLowerCase();
    const checkinCode = String(participant.checkinCode || '').toLowerCase();
    const bookingCode = String(booking.bookingCode || '').toLowerCase();
    const customerPhone = String(booking.customer?.phone || '').toLowerCase();
    const email = String(booking.customer?.email || '').toLowerCase();

    let score = 0;
    const matchDetails = [];

    // Branch 1: Full name matching (exact, prefix, substring)
    if (fullName === term) {
      // Exact match on full name
      score += 100;
      matchDetails.push({ field: 'fullName', type: 'EXACT', weight: 100 });
    } else if (fullName.startsWith(term)) {
      // Starts with match on full name
      score += 80;
      matchDetails.push({ field: 'fullName', type: 'PREFIX', weight: 80 });
    } else if (fullName.includes(term)) {
      // Contains match on full name
      score += 60;
      matchDetails.push({ field: 'fullName', type: 'SUBSTRING', weight: 60 });
    } else if (this._fuzzyMatch(fullName, term)) {
      // Fuzzy match on full name
      score += 30;
      matchDetails.push({ field: 'fullName', type: 'FUZZY', weight: 30 });
    }

    // Branch 2: Check-in code matching (exact priority)
    if (checkinCode === term) {
      score += 95;
      matchDetails.push({ field: 'checkinCode', type: 'EXACT', weight: 95 });
    } else if (checkinCode.startsWith(term)) {
      score += 75;
      matchDetails.push({ field: 'checkinCode', type: 'PREFIX', weight: 75 });
    } else if (checkinCode.includes(term)) {
      score += 50;
      matchDetails.push({ field: 'checkinCode', type: 'SUBSTRING', weight: 50 });
    }

    // Branch 3: Booking code matching
    if (bookingCode === term) {
      score += 70;
      matchDetails.push({ field: 'bookingCode', type: 'EXACT', weight: 70 });
    } else if (bookingCode.includes(term)) {
      score += 40;
      matchDetails.push({ field: 'bookingCode', type: 'SUBSTRING', weight: 40 });
    }

    // Branch 4: Phone number matching (numeric extraction)
    const cleanedPhone = customerPhone.replace(/\D/g, '');
    const cleanedTerm = term.replace(/\D/g, '');

    if (cleanedPhone === cleanedTerm && cleanedTerm.length >= 5) {
      score += 85;
      matchDetails.push({ field: 'phone', type: 'EXACT', weight: 85 });
    } else if (cleanedPhone.includes(cleanedTerm) && cleanedTerm.length >= 3) {
      score += 55;
      matchDetails.push({ field: 'phone', type: 'SUBSTRING', weight: 55 });
    }

    // Branch 5: Email matching
    if (email === term) {
      score += 65;
      matchDetails.push({ field: 'email', type: 'EXACT', weight: 65 });
    } else if (email.includes(term)) {
      score += 35;
      matchDetails.push({ field: 'email', type: 'SUBSTRING', weight: 35 });
    }

    // Determine final match status
    const isMatched = score > 0;
    const reason = isMatched
      ? matchDetails.length > 0
        ? matchDetails[0].field.toUpperCase()
        : 'UNKNOWN'
      : 'NO_MATCH';

    return {
      score: Math.min(score, 100), // Cap at 100
      matched: isMatched,
      reason,
      details: matchDetails
    };
  }

  /**
   * Simple fuzzy matching algorithm
   */
  static _fuzzyMatch(str, pattern) {
    let patternIdx = 0;
    for (let i = 0; i < str.length && patternIdx < pattern.length; i++) {
      if (str[i] === pattern[patternIdx]) {
        patternIdx++;
      }
    }
    return patternIdx === pattern.length;
  }

  /**
   * Evaluate checkin status filter with complex conditions
   */
  static evaluateCheckinStatusFilter(participant, checkinStatusFilter) {
    const isCheckedIn = Boolean(participant.checkinAt);
    const checkInDaysAgo = this._calculateDaysAgo(participant.checkinAt);

    // Branch 1: Filter by status type
    if (checkinStatusFilter === 'checked') {
      // Branch 1a: If checked, further filter by how recent
      if (!isCheckedIn) {
        return { passes: false, reason: 'NOT_CHECKED_IN', priority: 0 };
      }

      // Branch 1b: Recent check-ins (high priority)
      if (checkInDaysAgo === 0) {
        return { passes: true, reason: 'RECENTLY_CHECKED_IN_TODAY', priority: 5 };
      } else if (checkInDaysAgo <= 1) {
        return { passes: true, reason: 'CHECKED_IN_LAST_DAY', priority: 4 };
      } else {
        return { passes: true, reason: 'CHECKED_IN_EARLIER', priority: 3 };
      }
    } else if (checkinStatusFilter === 'unchecked') {
      // Branch 1c: If unchecked filter
      if (isCheckedIn) {
        return { passes: false, reason: 'ALREADY_CHECKED_IN', priority: 0 };
      } else {
        // Further evaluate urgency of check-in
        return { passes: true, reason: 'PENDING_CHECK_IN', priority: 2 };
      }
    } else if (checkinStatusFilter === 'pending_soon') {
      // Branch 1d: Special filter - not checked in and needs urgent attention
      if (isCheckedIn) {
        return { passes: false, reason: 'ALREADY_CHECKED_IN', priority: 0 };
      }
      return { passes: true, reason: 'PENDING_SOON', priority: 1 };
    } else {
      // Branch 1e: 'all' or any other value
      if (isCheckedIn) {
        return { passes: true, reason: 'ALL_CHECKED', priority: 4 };
      } else {
        return { passes: true, reason: 'ALL_UNCHECKED', priority: 2 };
      }
    }
  }

  /**
   * Calculate days ago from a date
   */
  static _calculateDaysAgo(dateStr) {
    if (!dateStr) return Infinity;
    const checkInDate = new Date(dateStr);
    const now = new Date();
    const diffMs = now - checkInDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Apply participant type filter
   */
  static evaluateParticipantTypeFilter(participant, typeFilter) {
    if (!typeFilter || typeFilter === 'all') {
      return { passes: true, reason: 'NO_TYPE_FILTER' };
    }

    const participantType = String(participant.participantType || '').toUpperCase();

    // Branch: Type-specific filtering
    if (typeFilter.toUpperCase() === 'ADULT') {
      if (participantType === 'ADULT') {
        return { passes: true, reason: 'IS_ADULT' };
      } else {
        return { passes: false, reason: 'NOT_ADULT', priority: 0 };
      }
    } else if (typeFilter.toUpperCase() === 'CHILD') {
      if (participantType === 'CHILD') {
        return { passes: true, reason: 'IS_CHILD' };
      } else {
        return { passes: false, reason: 'NOT_CHILD', priority: 0 };
      }
    } else {
      return { passes: true, reason: 'UNKNOWN_TYPE_FILTER' };
    }
  }

  /**
   * Apply isLead (group leader) filter
   * isLeadFilter: 'all' | 'lead'
   */
  static evaluateIsLeadFilter(participant, isLeadFilter) {
    if (!isLeadFilter || isLeadFilter === 'all') {
      return { passes: true, reason: 'NO_LEAD_FILTER' };
    }

    if (isLeadFilter === 'lead') {
      if (participant.isLead) return { passes: true, reason: 'IS_LEAD' };
      return { passes: false, reason: 'NOT_LEAD', priority: 0 };
    }

    return { passes: true, reason: 'UNKNOWN_LEAD_FILTER' };
  }

  /**
   * Apply payment status filter
   */
  static evaluatePaymentStatusFilter(booking, paymentStatusFilter) {
    if (!paymentStatusFilter || paymentStatusFilter === 'all') {
      return { passes: true, reason: 'NO_PAYMENT_FILTER' };
    }

    const bookingStatus = String(booking.status || '').toUpperCase();
    const debtAmount = booking.debtAmount || 0;

    // Branch: Payment status filtering
    if (paymentStatusFilter === 'paid') {
      if (bookingStatus === 'PAID' || debtAmount === 0) {
        return { passes: true, reason: 'FULLY_PAID' };
      } else {
        return { passes: false, reason: 'NOT_PAID', priority: 0 };
      }
    } else if (paymentStatusFilter === 'pending') {
      if (bookingStatus === 'PENDING' || debtAmount > 0) {
        return { passes: true, reason: 'PAYMENT_PENDING' };
      } else {
        return { passes: false, reason: 'NOT_PENDING', priority: 0 };
      }
    } else if (paymentStatusFilter === 'partial') {
      if (debtAmount > 0 && bookingStatus !== 'NOT_PAID') {
        return { passes: true, reason: 'PARTIAL_PAYMENT' };
      } else {
        return { passes: false, reason: 'NOT_PARTIAL', priority: 0 };
      }
    } else {
      return { passes: true, reason: 'UNKNOWN_PAYMENT_FILTER' };
    }
  }

  /**
   * Filter participants with all criteria combined
   * This is the main filtering function with multiple decision branches
   */
  static filterParticipants(assignment, filters) {
    const payload = assignment.toJSON ? assignment.toJSON() : assignment;
    const bookings = payload.schedule?.bookings || [];

    const stats = {
      total: 0,
      matched: 0,
      checkedInTotal: 0,
      checkedInMatched: 0,
      searchMatches: 0,
      checkinStatusMatches: 0,
      paymentStatusMatches: 0,
      typeMatches: 0,
      leadMatches: 0,
      search: filters.search,
      checkinStatus: filters.checkinStatus,
      paymentStatus: filters.paymentStatus || 'all',
      participantType: filters.participantType || 'all'
    };

    const details = {
      bookings: [],
      rejectedParticipants: []
    };

    payload.schedule.bookings = bookings.map((booking) => {
      const participants = booking.participants || [];
      const filteredParticipants = [];

      participants.forEach((participant) => {
        stats.total++;

        if (participant.checkinAt) {
          stats.checkedInTotal++;
        }

        // Main decision tree starts here
        // Branch A: Search filter
        const searchResult = this.calculateSearchScore(participant, booking, filters.search);
        if (filters.hasSearch && !searchResult.matched) {
          details.rejectedParticipants.push({
            id: participant.id,
            reason: 'SEARCH_MISMATCH',
            searchResult
          });
          return;
        }
        if (searchResult.matched) stats.searchMatches++;

        // Branch B: Check-in status filter
        const checkinResult = this.evaluateCheckinStatusFilter(participant, filters.checkinStatus);
        if (!checkinResult.passes) {
          details.rejectedParticipants.push({
            id: participant.id,
            reason: 'CHECKIN_STATUS_MISMATCH',
            checkinResult
          });
          return;
        }
        stats.checkinStatusMatches++;

        // Branch C: Participant type filter
        const typeResult = this.evaluateParticipantTypeFilter(participant, filters.participantType);
        if (!typeResult.passes) {
          details.rejectedParticipants.push({
            id: participant.id,
            reason: 'TYPE_MISMATCH',
            typeResult
          });
          return;
        }
        stats.typeMatches++;

        // Branch C.5: isLead / group leader filter
        const leadResult = this.evaluateIsLeadFilter(participant, filters.isLead);
        if (!leadResult.passes) {
          details.rejectedParticipants.push({
            id: participant.id,
            reason: 'LEAD_FILTER_MISMATCH',
            leadResult
          });
          return;
        }
        stats.leadMatches++;

        // Branch D: Payment status filter
        const paymentResult = this.evaluatePaymentStatusFilter(booking, filters.paymentStatus);
        if (!paymentResult.passes) {
          details.rejectedParticipants.push({
            id: participant.id,
            reason: 'PAYMENT_STATUS_MISMATCH',
            paymentResult
          });
          return;
        }
        stats.paymentStatusMatches++;

        // All conditions passed
        stats.matched++;
        if (participant.checkinAt) {
          stats.checkedInMatched++;
        }

        filteredParticipants.push({
          ...participant,
          _searchScore: searchResult.score,
          _searchDetails: searchResult.details,
          _checkinPriority: checkinResult.priority || 0
        });
      });

      return {
        ...booking,
        participants: filteredParticipants
      };
    });

    payload.participantStats = stats;
    payload._filterDetails = details;
    return payload;
  }

  /**
   * Apply sorting to filtered participants
   */
  static sortParticipants(participantsList, sortBy = 'name') {
    if (!participantsList || participantsList.length === 0) {
      return participantsList;
    }

    const list = [...participantsList];

    // Branch: Different sorting strategies
    if (sortBy === 'search_score') {
      list.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
    } else if (sortBy === 'checkin_priority') {
      list.sort((a, b) => (b._checkinPriority || 0) - (a._checkinPriority || 0));
    } else if (sortBy === 'name') {
      list.sort((a, b) => {
        const nameA = String(a.fullName || '').toLowerCase();
        const nameB = String(b.fullName || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'date_of_birth') {
      list.sort((a, b) => {
        const dateA = new Date(a.dateOfBirth || 0);
        const dateB = new Date(b.dateOfBirth || 0);
        return dateA - dateB;
      });
    } else if (sortBy === 'recent_checkin') {
      list.sort((a, b) => {
        const dateA = new Date(a.checkinAt || 0);
        const dateB = new Date(b.checkinAt || 0);
        return dateB - dateA;
      });
    }

    return list;
  }

  /**
   * Normalize and validate filters
   */
  static normalizeFilters(queryFilters = {}) {
    const rawSearch = String(queryFilters.search || '').trim();
    const rawCheckinStatus = String(queryFilters.checkinStatus || 'all').trim().toLowerCase();
    const rawPaymentStatus = String(queryFilters.paymentStatus || 'all').trim().toLowerCase();
    const rawParticipantType = String(queryFilters.participantType || 'all').trim().toLowerCase();
    const rawSortBy = String(queryFilters.sortBy || 'name').trim().toLowerCase();
    const rawIsLead = String(queryFilters.isLead || 'all').trim().toLowerCase();

    // Validate checkin status
    const validCheckinStatuses = ['all', 'checked', 'unchecked', 'pending_soon'];
    const checkinStatus = validCheckinStatuses.includes(rawCheckinStatus)
      ? rawCheckinStatus
      : 'all';

    // Validate payment status
    const validPaymentStatuses = ['all', 'paid', 'pending', 'partial'];
    const paymentStatus = validPaymentStatuses.includes(rawPaymentStatus)
      ? rawPaymentStatus
      : 'all';

    // Validate participant type
    const validTypes = ['all', 'adult', 'child'];
    const participantType = validTypes.includes(rawParticipantType)
      ? rawParticipantType
      : 'all';

    // Validate isLead filter
    const validLeadFilters = ['all', 'lead'];
    const isLead = validLeadFilters.includes(rawIsLead) ? rawIsLead : 'all';

    // Validate sort by
    const validSortOptions = ['name', 'search_score', 'checkin_priority', 'date_of_birth', 'recent_checkin'];
    const sortBy = validSortOptions.includes(rawSortBy) ? rawSortBy : 'name';

    return {
      search: rawSearch,
      hasSearch: rawSearch.length > 0,
      checkinStatus,
      paymentStatus,
      participantType,
      sortBy,
      isLead
    };
  }
}

export default ParticipantSearchService;


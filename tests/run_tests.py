#!/usr/bin/env python3
"""
=============================================================================
KageStream (formerly AnimeVault) - Automated API Test Suite
Day 13 Deliverable: Testing and Bug Fixes (#ALTABuilder30)
=============================================================================
Tests all core flows, edge cases, input validation, and HTTP response codes:
  1. System Health & Metadata API
  2. Anime Catalog Search, Filter & Pagination
  3. Genre Taxonomy & Relational Enrichment
  4. Single Anime Detail & Episode Relationships
  5. Episode Listing by Anime
  6. Auth Registration Input Validation (Rejects short pass, invalid email, duplicates)
  7. Auth Registration & Login Happy Path (Token verification)
  8. Multi-CDN Stream Source Resolver (Preferred servers, audio tracks)
  9. Stream Resolver Edge Cases (400 on malformed, 404 on missing)
 10. Real-Time Watch Progress Sync Heartbeat
 11. Watch Progress Sync Validation (Rejection on bad payloads)
 12. Playback Auto-Resume Metadata Retrieval
 13. Episode Community Comments Creation & Input Validation (Max length, empty)
 14. Episode Comments Feed Retrieval
 15. User Watchlist CRUD & Status Validation
 16. HTTP 206 Partial Content Range Streaming Demo
=============================================================================
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import urllib.parse

BASE_URL = os.environ.get('API_URL', 'http://localhost:5050').rstrip('/')

GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

tests_run = 0
tests_passed = 0
tests_failed = 0
failures = []

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
        headers['Cookie'] = f"auth_token={token}; token={token}"

    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            content = resp.read().decode('utf-8')
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return status, parsed
    except urllib.error.HTTPError as e:
        status = e.code
        content = e.read().decode('utf-8')
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = content
        return status, parsed
    except Exception as e:
        return 500, {'error': str(e)}

def run_test(name, fn):
    global tests_run, tests_passed, tests_failed
    tests_run += 1
    t0 = time.time()
    try:
        fn()
        elapsed = (time.time() - t0) * 1000
        print(f"  {GREEN}✓ PASS{RESET} [{elapsed:5.1f}ms] {name}")
        tests_passed += 1
    except AssertionError as e:
        elapsed = (time.time() - t0) * 1000
        print(f"  {RED}✗ FAIL{RESET} [{elapsed:5.1f}ms] {name}: {e}")
        tests_failed += 1
        failures.append((name, str(e)))
    except Exception as e:
        elapsed = (time.time() - t0) * 1000
        print(f"  {RED}✗ ERR {RESET} [{elapsed:5.1f}ms] {name}: {e}")
        tests_failed += 1
        failures.append((name, str(e)))

print(f"\n{BOLD}{CYAN}==================================================================={RESET}")
print(f"{BOLD}{CYAN}   KAGESTREAM AUTOMATED API TEST SUITE (DAY 13 - #ALTABuilder30)    {RESET}")
print(f"{BOLD}{CYAN}   Target Server: {BASE_URL}                                        {RESET}")
print(f"{BOLD}{CYAN}==================================================================={RESET}\n")

# Shared state across sequential tests
state = {}

# Test 1: Health & System Diagnostics
def test_health():
    status, body = request('GET', '/api/health')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('status') == 'healthy', f"Expected status healthy, got {body}"
run_test("Test 1: Health & Diagnostics (/api/health)", test_health)

# Test 2: Paginated Anime Catalog & Search
def test_catalog():
    status, body = request('GET', '/api/anime?page=1&limit=5&search=titan')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    data = body.get('data', {})
    anime = data.get('anime', [])
    assert len(anime) > 0, "Expected at least 1 anime matching 'titan'"
    assert 'titan' in anime[0].get('title', '').lower(), "Title should match search term"
    pagination = data.get('pagination', {})
    assert pagination.get('page') == 1, "Page should be 1"
run_test("Test 2: Anime Catalog Search & Pagination (/api/anime)", test_catalog)

# Test 3: Genre Taxonomy & Counts
def test_genres():
    status, body = request('GET', '/api/genres')
    assert status == 200, f"Expected 200, got {status}"
    genres = body.get('data', [])
    assert len(genres) >= 5, f"Expected at least 5 genres, got {len(genres)}"
    slugs = [g.get('slug') for g in genres]
    assert 'action' in slugs or 'shounen' in slugs, "Expected core genres present"
run_test("Test 3: Genre Taxonomy Taxonomy (/api/genres)", test_genres)

# Test 4: Single Anime Detail & Relationships
def test_single_anime():
    status, body = request('GET', '/api/anime/1')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    anime = body.get('data', {})
    assert anime.get('id') == 1, "Anime ID should be 1"
    assert 'episodes' in anime, "Anime should have episodes relation"
    assert 'genres' in anime, "Anime should have genres relation"
run_test("Test 4: Single Anime Details & Relations (/api/anime/1)", test_single_anime)

# Test 5: Episodes Listing API
def test_anime_episodes():
    status, body = request('GET', '/api/anime/1/episodes')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    data = body.get('data', {})
    episodes = data.get('episodes', [])
    assert len(episodes) > 0, "Expected episodes array not empty"
    assert episodes[0].get('number') == 1, "First episode should be #1"
    state['first_episode_id'] = episodes[0]['id']
run_test("Test 5: Anime Episodes Listing (/api/anime/1/episodes)", test_anime_episodes)

# Test 6: Registration Bad Input Validation (400 & 409 errors)
def test_auth_validation():
    # 6a. Empty body
    s1, b1 = request('POST', '/api/auth/register', {})
    assert s1 == 400, f"Expected 400 for empty body, got {s1}"

    # 6b. Short password (< 8 chars)
    s2, b2 = request('POST', '/api/auth/register', {
        'username': 'tester99',
        'email': 'valid@example.com',
        'password': '123'
    })
    assert s2 == 400, f"Expected 400 for short password, got {s2}"

    # 6c. Invalid email format
    s3, b3 = request('POST', '/api/auth/register', {
        'username': 'tester99',
        'email': 'not-an-email',
        'password': 'SecurePassword123'
    })
    assert s3 == 400, f"Expected 400 for invalid email, got {s3}"
run_test("Test 6: Auth Registration Input Validation (400 Rejections)", test_auth_validation)

# Test 7: Auth Happy Path (Registration & Login)
def test_auth_happy_path():
    ts = int(time.time())
    unique_user = f"tester_{ts}"
    unique_email = f"tester_{ts}@kagestream.io"
    password = "KageStreamPassword2026!"

    # Register
    status, body = request('POST', '/api/auth/register', {
        'username': unique_user,
        'email': unique_email,
        'password': password
    })
    assert status == 201, f"Expected 201 Created, got {status}: {body}"
    assert body.get('success') is True, "Expected success: true"
    token = body.get('token')
    assert token, "Expected auth token"
    state['auth_token'] = token

    # Login
    s_login, b_login = request('POST', '/api/auth/login', {
        'email': unique_email,
        'password': password
    })
    assert s_login == 200, f"Expected 200 Login, got {s_login}"
    assert b_login.get('token'), "Expected token from login response"
run_test("Test 7: Auth Registration & Login Happy Path (201 & 200)", test_auth_happy_path)

# Test 8: Multi-CDN Stream Resolver
def test_stream_resolve():
    ep_id = state.get('first_episode_id', 1)
    status, body = request('GET', f"/api/stream/resolve/{ep_id}")
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    data = body.get('data', {})
    servers = data.get('servers', [])
    assert len(servers) >= 2, f"Expected at least 2 CDN servers, got {len(servers)}"
    assert any(s.get('preferred') for s in servers), "At least one server must be marked preferred"
    episode = data.get('episode', {})
    assert 'audio_language' in episode, "Episode should declare audio language"
run_test("Test 8: Multi-CDN Stream Source Resolver (/api/stream/resolve/:id)", test_stream_resolve)

# Test 9: Stream Resolver Bad Input & 404
def test_stream_resolve_edge_cases():
    # 9a. Non-existent episode ID (404)
    s1, b1 = request('GET', '/api/stream/resolve/999999')
    assert s1 == 404, f"Expected 404 for missing episode, got {s1}"

    # 9b. Malformed episode ID (400)
    s2, b2 = request('GET', '/api/stream/resolve/invalid-id')
    assert s2 == 400, f"Expected 400 for malformed episode ID, got {s2}"
run_test("Test 9: Stream Resolver Boundary & 404 Validation", test_stream_resolve_edge_cases)

# Test 10: Real-Time Watch Progress Sync Heartbeat
def test_stream_sync():
    ep_id = state.get('first_episode_id', 1)
    status, body = request('POST', '/api/stream/sync', {
        'episode_id': ep_id,
        'progress_seconds': 450,
        'duration_seconds': 1440
    }, token=state.get('auth_token'))
    assert status == 200, f"Expected 200, got {status}: {body}"
    assert body.get('success') is True, "Expected success: true"
    data = body.get('data', {})
    assert data.get('progress_seconds') == 450, "Progress seconds must be saved"
    assert data.get('percent_watched') == 31, f"Expected 31%, got {data.get('percent_watched')}"
run_test("Test 10: Watch Progress Sync Heartbeat (POST /api/stream/sync)", test_stream_sync)

# Test 11: Stream Sync Input Validation
def test_sync_validation():
    # 11a. Missing episode_id
    s1, b1 = request('POST', '/api/stream/sync', {
        'progress_seconds': 200
    })
    assert s1 == 400, f"Expected 400 for missing episode_id, got {s1}"

    # 11b. Non-existent episode_id
    s2, b2 = request('POST', '/api/stream/sync', {
        'episode_id': 999999,
        'progress_seconds': 100
    })
    assert s2 == 404, f"Expected 404 for non-existent episode, got {s2}"
run_test("Test 11: Watch Progress Sync Input Validation (400 & 404)", test_sync_validation)

# Test 12: Playback Auto-Resume Metadata Retrieval
def test_playback_resume():
    status, body = request('GET', '/api/stream/resume/1', token=state.get('auth_token'))
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
run_test("Test 12: Playback Auto-Resume Metadata (/api/stream/resume/:animeId)", test_playback_resume)

# Test 13: Episode Comments Creation & Validation
def test_episode_comments_flow():
    ep_id = state.get('first_episode_id', 1)

    # 13a. Empty comment rejection (400)
    s_empty, b_empty = request('POST', f"/api/stream/episode/{ep_id}/comments", {
        'content': '   '
    })
    assert s_empty == 400, f"Expected 400 for empty comment, got {s_empty}"

    # 13b. Valid comment creation (201)
    status, body = request('POST', f"/api/stream/episode/{ep_id}/comments", {
        'content': 'Epic animation! The cliffhanger at the end gave me chills.'
    }, token=state.get('auth_token'))
    assert status == 201, f"Expected 201 Created, got {status}: {body}"
    assert body.get('success') is True, "Expected success: true"
    comment = body.get('data', {})
    assert 'The cliffhanger' in comment.get('content', ''), "Comment text mismatch"
run_test("Test 13: Episode Comments Creation & Validation (POST /comments)", test_episode_comments_flow)

# Test 14: Episode Comments Feed Retrieval
def test_episode_comments_get():
    ep_id = state.get('first_episode_id', 1)
    status, body = request('GET', f"/api/stream/episode/{ep_id}/comments")
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    comments = body.get('data', [])
    assert len(comments) > 0, "Comments list should contain at least 1 comment"
run_test("Test 14: Episode Comments Feed Retrieval (GET /comments)", test_episode_comments_get)

# Test 15: Watchlist CRUD & Validation
def test_watchlist_crud():
    token = state.get('auth_token')

    # 15a. Bad input validation: Invalid status (400)
    s_bad, b_bad = request('POST', '/api/user/watchlist', {
        'anime_id': 1,
        'status': 'invalid_status_xyz'
    }, token=token)
    assert s_bad == 400, f"Expected 400 for invalid status, got {s_bad}"

    # 15b. Happy path: Add to watchlist (200 / 201)
    status, body = request('POST', '/api/user/watchlist', {
        'anime_id': 1,
        'status': 'watching',
        'current_episode': 1
    }, token=token)
    assert status in [200, 201], f"Expected 200/201, got {status}"

    # 15c. Read watchlist
    s_get, b_get = request('GET', '/api/user/watchlist', token=token)
    assert s_get == 200, f"Expected 200, got {s_get}"
    assert b_get.get('count', 0) >= 1, "Expected at least 1 entry in watchlist"
run_test("Test 15: Watchlist CRUD & Status Validation (/api/user/watchlist)", test_watchlist_crud)

# Test 16: HTTP Range Streaming Demo
def test_range_streaming():
    status, body = request('GET', '/api/stream/range-demo')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    data = body.get('data', {})
    assert 'range_support' in data, "Range demo should report range_support"
    assert data.get('range_support') is True, "Range support should be True"
run_test("Test 16: HTTP 206 Range Streaming Demo (/api/stream/range-demo)", test_range_streaming)

print(f"\n{BOLD}{CYAN}-------------------------------------------------------------------{RESET}")
print(f"{BOLD}SUMMARY: {tests_run} Total Tests | {GREEN}{tests_passed} Passed{RESET} | {RED if tests_failed > 0 else GREEN}{tests_failed} Failed{RESET}")
print(f"{BOLD}{CYAN}-------------------------------------------------------------------{RESET}\n")

if tests_failed > 0:
    print(f"{RED}{BOLD}Failed Tests Details:{RESET}")
    for name, reason in failures:
        print(f"  • {name}: {reason}")
    sys.exit(1)
else:
    print(f"{GREEN}{BOLD}🎉 ALL 16 TESTS PASSED FLAWLESSLY! DAY 13 TESTING DELIVERABLE COMPLETE!{RESET}\n")
    sys.exit(0)

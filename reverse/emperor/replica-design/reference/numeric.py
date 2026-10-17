"""Small executable specification; not a game engine or a DOS emulator."""
MASK32 = (1 << 32) - 1

def unsigned(n, bits): return n & ((1 << bits) - 1)
def signed(n, bits):
    n = unsigned(n, bits)
    return n - (1 << bits) if n & (1 << (bits - 1)) else n

def trunc_div(a, b):
    if b == 0: raise ZeroDivisionError('original signed divisor is zero')
    return (abs(a) // abs(b)) * (-1 if (a < 0) != (b < 0) else 1)

def idiv32(a, b):
    q = trunc_div(a, b)
    if not -(1 << 31) <= q < (1 << 31): raise OverflowError('x86 signed division overflow')
    return q

def next_random(seed):
    seed = (seed * 1103515245 + 12345) & MASK32
    return seed, (seed >> 16) & 32767

def gate(seed, threshold):
    new_seed, r = next_random(seed)
    return {'seed_before': seed & MASK32, 'seed_after': new_seed,
            'random': r, 'remainder': r % 100,
            'signed_threshold': signed(threshold, 16),
            'success': r % 100 < signed(threshold, 16)}

def residue_success_count(threshold):
    t = signed(threshold, 16)
    return sum(r % 100 < t for r in range(32768))

def treaty_base(friendship, prestige, military, foreign_military):
    inner = idiv32(signed(prestige * military, 32), foreign_military)
    return idiv32(signed(signed(friendship * friendship, 32) * inner, 32), 10000)

def treaty_threshold(kind, base):
    if kind == 1: return signed(base, 16)
    if kind == 2: return signed(2 * base, 16)
    if kind == 3: return signed(trunc_div(signed(base, 16), 20), 16)
    if kind == 4: return None  # Accepts without invoking probability gate.
    raise ValueError('not a recovered treaty kind')

def tribute_delta(amount): return trunc_div(signed(amount, 16), 2000)
def extortion_delta(amount): return trunc_div(signed(amount, 16), 1000)

def self_check():
    assert signed(65535, 16) == -1 and signed(32768, 16) == -32768
    assert unsigned(-1, 8) == 255 and trunc_div(-7, 3) == -2
    assert next_random(1) == (1103527590, 16838)
    assert gate(1, 0)['seed_after'] == gate(1, 100)['seed_after']
    assert not gate(1, 0)['success'] and gate(1, 100)['success']
    assert not gate(1, 65535)['success']
    assert residue_success_count(1) == 328
    assert residue_success_count(68) == 22304
    assert residue_success_count(100) == 32768
    assert treaty_base(70, 50, 20, 10) == 49
    assert treaty_threshold(3, 32768) == -1638
    assert [tribute_delta(x) for x in [1999, 2000, 32000]] == [0, 1, 16]
    assert [extortion_delta(x) for x in [999, 1000]] == [0, 1]
    try: idiv32(-(1 << 31), -1)
    except OverflowError: pass
    else: raise AssertionError('missing division overflow')
    return {'numeric_reference': 'passed', 'scope': 'bounded arithmetic/LCG/treaty/amount semantics; no game or UI equivalence claim'}

if __name__ == '__main__':
    import json
    print(json.dumps(self_check(), ensure_ascii=False))

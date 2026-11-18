"""Authored note lengths, playing strengths and entrances for the 40-second edit.

Each event is (seconds, concert MIDI pitch, gate seconds, musician's gain in dB):
38 D2, 41 F2, 43 G2, 45 A2, 48 C3, 50 D3. Note tails follow each gate.
"""
# A muted repetition picks up to the fifth after the regular pulse.
# Silence beside the three pictured hand contacts at 6.75, 21.917 and 25.083.
WOOD = (
    (0.33, 38, .69, 0), (1.25, 38, .15, -5.2), (1.76, 45, .62, -1.3),
    (2.69, 41, .21, -4.4), (3.17, 38, .72, -.1), (4.18, 33, .26, -3.0),
    (4.91, 38, .84, -1.6), (6.03, 45, .35, -2.8),
    (7.37, 38, .71, .2), (8.32, 38, .13, -6.0), (8.79, 45, .64, -.8),
    (9.74, 48, .21, -2.6), (10.21, 43, .64, -.3), (11.25, 38, .72, -2.7),
    (12.48, 45, .28, -3.3), (13.23, 41, .57, -1.7),
    (14.19, 38, .67, -1.8), (15.17, 38, .12, -5.8), (15.61, 45, .62, -2.4),
    (16.51, 48, .22, -2.7), (17.08, 41, .47, -1.6),
    (18.81, 38, .77, -3.7), (20.27, 45, .61, -4.1),
    # The hands open. For three measures the pulse is only implied.
    (22.68, 38, .83, -4.3),
    # A lifted D above the familiar low D makes the return identifiable in history.
    (27.64, 50, .24, -4.2), (28.16, 38, .79, -.8),
    # Answer “Tidligere” in the gap between sentences. Event order selects
    # recorded takes, so the short F keeps its take when played after “sæt”.
    (30.28, 38, .12, -6.4), (30.44, 45, .40, -3.5), (31.96, 41, .13, -4.8),
    (31.12, 38, .72, -1.4), (32.17, 43, .41, -3.6), (32.93, 45, .58, -3),
    (34.11, 38, .82, -1.6), (35.13, 38, .16, -6.0), (35.60, 45, .64, -2.7),
    (36.75, 41, .46, -4.6), (37.80, 38, 1.55, -2.2),
)
# Two restrained bow changes, played on the same instrument. Open fifths keep
# the hand/recovery image harmonically neutral. No room or pad is added.
BOW = (
    (5.78, 45, 1.28, -14.0),
    (22.76, 45, 2.07, -11.8),
    (25.45, 50, 1.50, -13.8),
    (36.92, 45, 1.46, -15.5),
)

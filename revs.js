"use strict";
var revs = [
 {
  "author": "Kevin Gibbons",
  "date": "2020-02-13 12:26:21 -0800",
  "hash": "823aad1e08b5680229d67283371912950d19e581",
  "parents": "bf37eb35b715b14e7a8f8c73059e11da75f7944a",
  "subject": "Editorial: add missing argument to two CreateImmutableBinding calls (#1864)"
 },
 {
  "author": "Kevin Gibbons",
  "date": "2020-02-13 12:26:21 -0800",
  "hash": "823aad1e08b5680229d67283371912950d19e581",
  "parents": "bf37eb35b715b14e7a8f8c73059e11da75f7944a",
  "subject": "Editorial: add missing argument to two CreateImmutableBinding calls (#1864)"
 },
 {
  "author": "Bradley Farias",
  "date": "2020-02-13 12:21:38 -0800",
  "hash": "bf37eb35b715b14e7a8f8c73059e11da75f7944a",
  "parents": "2669d458ec0d5c2ccce3b105b288ec57f81aee4f",
  "subject": "Normative: Make super() throw after evaluating args (#1775)"
 },
 {
  "author": "Bradley Farias",
  "date": "2020-02-13 12:21:38 -0800",
  "hash": "bf37eb35b715b14e7a8f8c73059e11da75f7944a",
  "parents": "2669d458ec0d5c2ccce3b105b288ec57f81aee4f",
  "subject": "Normative: Make super() throw after evaluating args (#1775)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-02-13 12:05:36 -0800",
  "hash": "2669d458ec0d5c2ccce3b105b288ec57f81aee4f",
  "parents": "ddac91dc5449da3d62ac07571dc491c7b3ffe157",
  "subject": "Editorial: fix inconsistency re type of [[SourceText]] (#1547)"
 },
 {
  "author": "Jordan Harband",
  "date": "2020-02-08 16:54:41 -1000",
  "hash": "ddac91dc5449da3d62ac07571dc491c7b3ffe157",
  "parents": "787642ad2d159c8358a8782c9414f6d5fb6efa6f",
  "subject": "Normative: ToInteger normalizes `-0` to `+0` (#1827)"
 },
 {
  "author": "chicoxyzzy",
  "date": "2020-02-04 15:11:51 -1000",
  "hash": "787642ad2d159c8358a8782c9414f6d5fb6efa6f",
  "parents": "e3707ac9e14b75b9513d6b09c394dee6473c5ddf",
  "subject": "Editorial: Update IEEE 754 standard version (#1770)"
 },
 {
  "author": "chicoxyzzy",
  "date": "2020-02-04 15:11:51 -1000",
  "hash": "787642ad2d159c8358a8782c9414f6d5fb6efa6f",
  "parents": "e3707ac9e14b75b9513d6b09c394dee6473c5ddf",
  "subject": "Editorial: Update IEEE 754 standard version (#1770)"
 },
 {
  "author": "Domenic Denicola",
  "date": "2020-02-02 21:04:38 -0800",
  "hash": "e3707ac9e14b75b9513d6b09c394dee6473c5ddf",
  "parents": "332d1ba127aac8e133a8c25789d01322bd4d2445",
  "subject": "Editorial: clarify ordinary and exotic object definitions and creation (#1460)"
 },
 {
  "author": "Domenic Denicola",
  "date": "2020-02-02 21:04:38 -0800",
  "hash": "e3707ac9e14b75b9513d6b09c394dee6473c5ddf",
  "parents": "332d1ba127aac8e133a8c25789d01322bd4d2445",
  "subject": "Editorial: clarify ordinary and exotic object definitions and creation (#1460)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-31 23:19:44 -0800",
  "hash": "332d1ba127aac8e133a8c25789d01322bd4d2445",
  "parents": "0a53d5657928f5e0af7ab81442a7a4286840be5d",
  "subject": "Editorial: Unify spelling of 'behaviour' (#1856)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-31 23:19:44 -0800",
  "hash": "332d1ba127aac8e133a8c25789d01322bd4d2445",
  "parents": "0a53d5657928f5e0af7ab81442a7a4286840be5d",
  "subject": "Editorial: Unify spelling of 'behaviour' (#1856)"
 },
 {
  "author": "Michael[tm] Smith",
  "date": "2020-01-31 23:16:21 -0800",
  "hash": "0a53d5657928f5e0af7ab81442a7a4286840be5d",
  "parents": "1a4fa5f51f33bede3a1e74ca2ae5f581e2bede30",
  "subject": "Meta: Update \"To make a pull request\" wording (#1832)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "1a4fa5f51f33bede3a1e74ca2ae5f581e2bede30",
  "parents": "0012b7a3be25ed851dfbbe5cc3f7c40d21d6596c",
  "subject": "Editorial: factor out _pText_ in RegExpInitialize (#1552)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "0012b7a3be25ed851dfbbe5cc3f7c40d21d6596c",
  "parents": "f9682aedaec1cee5d4b48dc37472700af92e4dd3",
  "subject": "Editorial: JSON.parse: insert missing UTF16DecodeString call (#1552)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "f9682aedaec1cee5d4b48dc37472700af92e4dd3",
  "parents": "335dec303196c4f1de21af532f2f7a2af82a4ab7",
  "subject": "Editorial: Rename some _fooText_ aliases (#1552)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "335dec303196c4f1de21af532f2f7a2af82a4ab7",
  "parents": "662f09919136590774e9f64643f0e6313850519b",
  "subject": "Editorial: Define + use abstract op UTF16DecodeString (#1552)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "662f09919136590774e9f64643f0e6313850519b",
  "parents": "0aec1df58e1e61631dc4bfd28ede6e4902c3265f",
  "subject": "Editorial: Rename UTF16Decode to UTF16DecodeSurrogatePair (#1552)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-31 23:06:56 -0800",
  "hash": "0aec1df58e1e61631dc4bfd28ede6e4902c3265f",
  "parents": "e5c0f84610df095de6256e6cf083f4a901e67fde",
  "subject": "Editorial: Define + use abstract op UTF16Encode (#1552)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-22 23:26:58 -0800",
  "hash": "e5c0f84610df095de6256e6cf083f4a901e67fde",
  "parents": "008fca6d9b08164be52c6f6a879b03d4663ff7f0",
  "subject": "Editorial: Give emu-notes some color (#1842)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-22 23:26:58 -0800",
  "hash": "e5c0f84610df095de6256e6cf083f4a901e67fde",
  "parents": "008fca6d9b08164be52c6f6a879b03d4663ff7f0",
  "subject": "Editorial: Give emu-notes some color (#1842)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-22 23:22:45 -0800",
  "hash": "008fca6d9b08164be52c6f6a879b03d4663ff7f0",
  "parents": "a879fd542718bcab6accd2d38964c410fffa28a9",
  "subject": "Editorial: Clean up some inline notes (#1831)"
 },
 {
  "author": "Timothy Gu",
  "date": "2020-01-22 23:18:49 -0800",
  "hash": "a879fd542718bcab6accd2d38964c410fffa28a9",
  "parents": "45e1f3e1e62da3267e4abc7b1b93bd61880ba37d",
  "subject": "Editorial: Fix return value logic for async arrow functions (#1406)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-22 23:15:50 -0800",
  "hash": "45e1f3e1e62da3267e4abc7b1b93bd61880ba37d",
  "parents": "6f8cc7b2e6dc665d03644869d5811aba60b037a3",
  "subject": "Editorial: Fix outdated Step # references in notes (#1835)"
 },
 {
  "author": "Jordan Harband",
  "date": "2020-01-22 23:13:00 -0800",
  "hash": "6f8cc7b2e6dc665d03644869d5811aba60b037a3",
  "parents": "5748238ce37dc438b2985b9a574674a63dc40572",
  "subject": "Editorial: `CreateArrayIterator`: add missing `kind` assertion (#1847)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-18 15:36:10 -0800",
  "hash": "5748238ce37dc438b2985b9a574674a63dc40572",
  "parents": "73ad5993a7c8cf8192fa485a91887437fa6b48ab",
  "subject": "Markup: Remove erroneous emu-grammar attribute."
 },
 {
  "author": "ExE Boss",
  "date": "2020-01-10 14:00:42 -0800",
  "hash": "73ad5993a7c8cf8192fa485a91887437fa6b48ab",
  "parents": "a329eefaca95fb1f91cf3828249e54f13b27e095",
  "subject": "Normative: Add\u00a0missing `ReturnIfAbrupt` to\u00a0\u201cEvaluation of\u00a0`in`\u00a0expression\u201d (#1826)"
 },
 {
  "author": "ExE Boss",
  "date": "2020-01-10 14:00:42 -0800",
  "hash": "73ad5993a7c8cf8192fa485a91887437fa6b48ab",
  "parents": "a329eefaca95fb1f91cf3828249e54f13b27e095",
  "subject": "Normative: Add\u00a0missing `ReturnIfAbrupt` to\u00a0\u201cEvaluation of\u00a0`in`\u00a0expression\u201d (#1826)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2020-01-09 22:08:15 -0800",
  "hash": "a329eefaca95fb1f91cf3828249e54f13b27e095",
  "parents": "63be86408b2c01899d6fd565db9a85d76a56de42",
  "subject": "Meta: Stop letting ecmarkup load 262's own outdated bibliography file (#1839)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2020-01-08 22:21:31 -0800",
  "hash": "63be86408b2c01899d6fd565db9a85d76a56de42",
  "parents": "b41a83231d69aec9a2f5caed4c74faff332726c6",
  "subject": "Editorial: Tweak casing of \"empty String\" and \"Number value\" (#1780)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2020-01-08 22:21:31 -0800",
  "hash": "63be86408b2c01899d6fd565db9a85d76a56de42",
  "parents": "b41a83231d69aec9a2f5caed4c74faff332726c6",
  "subject": "Editorial: Tweak casing of \"empty String\" and \"Number value\" (#1780)"
 },
 {
  "author": "Claude Pache",
  "date": "2020-01-06 10:48:56 -0800",
  "hash": "b41a83231d69aec9a2f5caed4c74faff332726c6",
  "parents": "f0c10cfb5ff87b892580cae6a2dc59a045cbac3e",
  "subject": "Normative: Add three missing checks in proxy internal methods (#666)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2020-01-03 15:33:10 -0800",
  "hash": "f0c10cfb5ff87b892580cae6a2dc59a045cbac3e",
  "parents": "cb73c69d861db21506c0246197fd87b723d6cdb4",
  "subject": "Normative: Fix the LexicalEnvironment of the execution context during function parameter evaluation (#1829)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2020-01-03 15:33:10 -0800",
  "hash": "f0c10cfb5ff87b892580cae6a2dc59a045cbac3e",
  "parents": "cb73c69d861db21506c0246197fd87b723d6cdb4",
  "subject": "Normative: Fix the LexicalEnvironment of the execution context during function parameter evaluation (#1829)"
 },
 {
  "author": "Jordan Harband",
  "date": "2020-01-02 19:23:03 -0800",
  "hash": "cb73c69d861db21506c0246197fd87b723d6cdb4",
  "parents": "c72089fb45587bcff8f7d53fa581ee11437e0a75",
  "subject": "Markup: remove stray `</ins>` tag (#1791)"
 },
 {
  "author": "Jordan Harband",
  "date": "2020-01-02 19:23:03 -0800",
  "hash": "cb73c69d861db21506c0246197fd87b723d6cdb4",
  "parents": "c72089fb45587bcff8f7d53fa581ee11437e0a75",
  "subject": "Markup: remove stray `</ins>` tag (#1791)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2020-01-02 16:12:27 -0800",
  "hash": "c72089fb45587bcff8f7d53fa581ee11437e0a75",
  "parents": "1bed13a1406554725a9cd9c32ff0fa17a643bb01",
  "subject": "Meta: Create LICENSE.md (#1386)"
 },
 {
  "author": "Kevin Gibbons",
  "date": "2020-01-02 15:51:17 -0800",
  "hash": "1bed13a1406554725a9cd9c32ff0fa17a643bb01",
  "parents": "384978f22bea3e6b13d6058aaaf25e6a2ffec0c1",
  "subject": "Normative: specify for-in enumeration order in more cases (#1791)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-02 15:48:17 -0800",
  "hash": "384978f22bea3e6b13d6058aaaf25e6a2ffec0c1",
  "parents": "f4d40a54eca38ca775df3f3825549ae380527e1a",
  "subject": "Markup: change id attribute of 2 new emu-clauses (#1787)"
 },
 {
  "author": "Michael Dyck",
  "date": "2020-01-02 15:48:17 -0800",
  "hash": "f4d40a54eca38ca775df3f3825549ae380527e1a",
  "parents": "b38902109c62ae5e904c225b4f695a6da0ad3300",
  "subject": "Markup: insert 3 missing end-tags (#1787)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2020-01-02 15:31:02 -0800",
  "hash": "b38902109c62ae5e904c225b4f695a6da0ad3300",
  "parents": "d12a7b019172a986f85350b23956e0a677cf82bf",
  "subject": "Editorial: Remove extra note from InternalizeJSONProperty (#1771)"
 },
 {
  "author": "Claude Pache",
  "date": "2020-01-02 15:09:26 -0800",
  "hash": "d12a7b019172a986f85350b23956e0a677cf82bf",
  "parents": "b3d48e36e772dc0b155be89b70d04169cefef92e",
  "subject": "Editorial: Add missing _direction_ parameter in extended regexp pattern evaluate semantics in Annex B (#1675)"
 },
 {
  "author": "Ms2ger",
  "date": "2020-01-02 15:07:12 -0800",
  "hash": "b3d48e36e772dc0b155be89b70d04169cefef92e",
  "parents": "d68b01881dc3bb9dcde6529532eb49b6a0fdb067",
  "subject": "Editorial: Remove redundant definitions of ComputedPropertyContains (#1666)"
 },
 {
  "author": "Adam Klein",
  "date": "2020-01-02 14:29:09 -0800",
  "hash": "d68b01881dc3bb9dcde6529532eb49b6a0fdb067",
  "parents": "ecb4178012d6b4d9abc13fcbd45f5c6394b832ce",
  "subject": "Normative: Eliminate extra environment for eval in parameter initializers (#1046)"
 },
 {
  "author": "Kevin Gibbons",
  "date": "2019-12-11 20:29:51 -0800",
  "hash": "ecb4178012d6b4d9abc13fcbd45f5c6394b832ce",
  "parents": "4175b01c800416365df2cb491e0c0560ea97916b",
  "subject": "Normative: make EnumerableOwnPropertyNames ordered (#1793)"
 },
 {
  "author": "Kevin Gibbons",
  "date": "2019-12-11 20:29:51 -0800",
  "hash": "ecb4178012d6b4d9abc13fcbd45f5c6394b832ce",
  "parents": "4175b01c800416365df2cb491e0c0560ea97916b",
  "subject": "Normative: make EnumerableOwnPropertyNames ordered (#1793)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-12-11 20:23:10 -0800",
  "hash": "4175b01c800416365df2cb491e0c0560ea97916b",
  "parents": "7f8129b0e031a52cb3f634b0f1291e6512e0a3ff",
  "subject": "Editorial: Quick fixes in preambles (#1805)"
 },
 {
  "author": "Daniel Rosenwasser",
  "date": "2019-12-11 20:13:18 -0800",
  "hash": "7f8129b0e031a52cb3f634b0f1291e6512e0a3ff",
  "parents": "f979933bc5be8847c024b77ab29a146b1bc2f879",
  "subject": "Normative: Add Nullish Coalescing (#1644)"
 },
 {
  "author": "Daniel Rosenwasser",
  "date": "2019-12-11 15:04:55 -0800",
  "hash": "f979933bc5be8847c024b77ab29a146b1bc2f879",
  "parents": "ae2d1a86868107e8f61db4c68af910c473d88c93",
  "subject": "Normative: Add Optional Chaining (#1646)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-12-11 14:59:38 -0800",
  "hash": "ae2d1a86868107e8f61db4c68af910c473d88c93",
  "parents": "f5436bfed9b1bd01ec35a074d8369d4a330e85ec",
  "subject": "Editorial: replace some uses of \"idempotent\" with alternative wording (#1363)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-12-11 14:59:38 -0800",
  "hash": "ae2d1a86868107e8f61db4c68af910c473d88c93",
  "parents": "f5436bfed9b1bd01ec35a074d8369d4a330e85ec",
  "subject": "Editorial: replace some uses of \"idempotent\" with alternative wording (#1363)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-12-11 13:21:09 -0800",
  "hash": "f5436bfed9b1bd01ec35a074d8369d4a330e85ec",
  "parents": "618479affe6b55bfca47fd058ce3a837a7d6c46c",
  "subject": "Editorial: Add Interesting Cases of Automatic Semicolon Insertion (#1062)"
 },
 {
  "author": "Toru Nagashima",
  "date": "2019-11-27 14:26:43 -0800",
  "hash": "618479affe6b55bfca47fd058ce3a837a7d6c46c",
  "parents": "9c8d03c1f1a0306d01e8422b28cde757093bd216",
  "subject": "Editorial: replace obj.[[Get]](j) with Get(obj, j) (#1183)"
 },
 {
  "author": "Toru Nagashima",
  "date": "2019-11-27 14:26:43 -0800",
  "hash": "618479affe6b55bfca47fd058ce3a837a7d6c46c",
  "parents": "9c8d03c1f1a0306d01e8422b28cde757093bd216",
  "subject": "Editorial: replace obj.[[Get]](j) with Get(obj, j) (#1183)"
 },
 {
  "author": "Darien Maillet Valentine",
  "date": "2019-11-21 16:51:30 -0800",
  "hash": "9c8d03c1f1a0306d01e8422b28cde757093bd216",
  "parents": "8c3fb1f0ed9b55ea1ca075b82e3525e469bd1b6b",
  "subject": "Editorial: Fix Elymiac row markup in scripts table (#1790)"
 },
 {
  "author": "Darien Maillet Valentine",
  "date": "2019-11-21 16:51:30 -0800",
  "hash": "9c8d03c1f1a0306d01e8422b28cde757093bd216",
  "parents": "8c3fb1f0ed9b55ea1ca075b82e3525e469bd1b6b",
  "subject": "Editorial: Fix Elymiac row markup in scripts table (#1790)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-11-20 15:17:05 -0800",
  "hash": "8c3fb1f0ed9b55ea1ca075b82e3525e469bd1b6b",
  "parents": "e6f8460c094807100683650e1381969b970d58e4",
  "subject": "Editorial: Extract IsNonNegativeInteger abstract op (#1567)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-11-18 22:50:11 -0800",
  "hash": "e6f8460c094807100683650e1381969b970d58e4",
  "parents": "acf7a5161b76991d89fe97478c45a3fc89960cfe",
  "subject": "Editorial: Simplify AssignmentTargetType values (#1652)"
 },
 {
  "author": "Ms2ger",
  "date": "2019-11-18 22:47:24 -0800",
  "hash": "acf7a5161b76991d89fe97478c45a3fc89960cfe",
  "parents": "cc2312dff4b6f70cc1a84d4ea961595501f68ae0",
  "subject": "Editorial: Remove stray reference to ModuleDeclarationEnvironmentSetup (#1653)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-11-18 22:42:24 -0800",
  "hash": "cc2312dff4b6f70cc1a84d4ea961595501f68ae0",
  "parents": "788736c4764901fb25d20ced12d5ac2e10957dc9",
  "subject": "Editorial: simplify ArraySetLength truncation (#1702)"
 },
 {
  "author": "Darien Maillet Valentine",
  "date": "2019-11-18 22:39:11 -0800",
  "hash": "788736c4764901fb25d20ced12d5ac2e10957dc9",
  "parents": "308d61e44ddc681081c18940134d375027d0ab74",
  "subject": "Editorial: Add BigInt to the list of possible reference base value types (#1773)"
 },
 {
  "author": "Darien Maillet Valentine",
  "date": "2019-11-18 22:39:11 -0800",
  "hash": "788736c4764901fb25d20ced12d5ac2e10957dc9",
  "parents": "308d61e44ddc681081c18940134d375027d0ab74",
  "subject": "Editorial: Add BigInt to the list of possible reference base value types (#1773)"
 },
 {
  "author": "Caio Lima",
  "date": "2019-11-18 22:29:11 -0800",
  "hash": "308d61e44ddc681081c18940134d375027d0ab74",
  "parents": "19e88da40ac69f64877404d9168dbdbe3bb19c6c",
  "subject": "Normative: Properly handle `Number(BigInt)` (#1766)"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-11-18 15:23:43 -0800",
  "hash": "19e88da40ac69f64877404d9168dbdbe3bb19c6c",
  "parents": "c77f0081a197eeaaf5589bc7ebe306b1cc5c9162",
  "subject": "Normative: IsSimpleParameterList is false for standalone rest parameters (#1608)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-18 15:15:19 -0800",
  "hash": "c77f0081a197eeaaf5589bc7ebe306b1cc5c9162",
  "parents": "ac78951866024bbc9344b4b3886198205cc3467b",
  "subject": "Revert \"Meta: [actions] add automatic rebasing / merge commit blocking\""
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-18 15:15:19 -0800",
  "hash": "c77f0081a197eeaaf5589bc7ebe306b1cc5c9162",
  "parents": "ac78951866024bbc9344b4b3886198205cc3467b",
  "subject": "Revert \"Meta: [actions] add automatic rebasing / merge commit blocking\""
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-18 15:02:06 -0800",
  "hash": "ac78951866024bbc9344b4b3886198205cc3467b",
  "parents": "6245deeb28c26bc4314d029f4f118057dbd78dc7",
  "subject": "Meta: [actions] add automatic rebasing / merge commit blocking"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-11-18 13:58:15 -0800",
  "hash": "6245deeb28c26bc4314d029f4f118057dbd78dc7",
  "parents": "2d14818913af111e58f31daac0312bcb43fe77d8",
  "subject": "Editorial: Name internal slots of iterators consistently (#1579)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-18 13:55:30 -0800",
  "hash": "2d14818913af111e58f31daac0312bcb43fe77d8",
  "parents": "edeeafa68a4350733157e643228e309258c960de",
  "subject": "Editorial: Fix dangling \"Otherwise\" step (#1784)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-11-13 22:11:22 -0800",
  "hash": "edeeafa68a4350733157e643228e309258c960de",
  "parents": "c808fe2b7bcc71ff22b06fe96b4260edcc4be5ba",
  "subject": "Editorial: Treat not present parameters as `undefined` (#1411)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-11-13 22:11:22 -0800",
  "hash": "edeeafa68a4350733157e643228e309258c960de",
  "parents": "c808fe2b7bcc71ff22b06fe96b4260edcc4be5ba",
  "subject": "Editorial: Treat not present parameters as `undefined` (#1411)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 22:04:54 -0800",
  "hash": "c808fe2b7bcc71ff22b06fe96b4260edcc4be5ba",
  "parents": "66242104e57ed82cf279445b72c3841f7526c18a",
  "subject": "Editorial: Delete \"be\" in 'Set' step; fix delimiters on String \"literals\" (#1778)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 22:04:54 -0800",
  "hash": "c808fe2b7bcc71ff22b06fe96b4260edcc4be5ba",
  "parents": "66242104e57ed82cf279445b72c3841f7526c18a",
  "subject": "Editorial: Delete \"be\" in 'Set' step; fix delimiters on String \"literals\" (#1778)"
 },
 {
  "author": "Kevin Gibbons",
  "date": "2019-11-13 21:54:48 -0800",
  "hash": "66242104e57ed82cf279445b72c3841f7526c18a",
  "parents": "3899f5910c7d9dfa71ff20e347fc0509fa345e1c",
  "subject": "Editorial: correctly determine flags for static RegExp parsing (#1464)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 21:49:47 -0800",
  "hash": "3899f5910c7d9dfa71ff20e347fc0509fa345e1c",
  "parents": "00fb677f596877426a8d5461839b7ef8fb8e059a",
  "subject": "Editorial: Simplify OrdinaryFunctionCreate's _kind_ parameter (#1562)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 21:49:46 -0800",
  "hash": "00fb677f596877426a8d5461839b7ef8fb8e059a",
  "parents": "150dcc21738ebb0ec663a2684336eb6ef9fd5a66",
  "subject": "Editorial: eliminate some *FunctionCreate operations (#1562)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 21:49:46 -0800",
  "hash": "150dcc21738ebb0ec663a2684336eb6ef9fd5a66",
  "parents": "604ed6500fdbc7f51d0d436f26c693a2ad3f6a2a",
  "subject": "Editorial: reorder steps of OrdinaryFunctionCreate (#1562)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 21:49:46 -0800",
  "hash": "604ed6500fdbc7f51d0d436f26c693a2ad3f6a2a",
  "parents": "d7ed3125b0253e23efc74b240b9664045f2014fb",
  "subject": "Editorial: Merge FunctionAllocate and FunctionInitialize (#1562)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 21:49:46 -0800",
  "hash": "d7ed3125b0253e23efc74b240b9664045f2014fb",
  "parents": "25926c40074bbe73ee8207bc2f908d263ada1f8c",
  "subject": "Editorial: small refactor in CreateDynamicFunction (#1562)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-11-13 15:37:24 -0800",
  "hash": "25926c40074bbe73ee8207bc2f908d263ada1f8c",
  "parents": "abb7cbda7d2134635738f2e3f759571349908a10",
  "subject": "Editorial: Delete unwanted use of \"implementation-defined\" (#1523)"
 },
 {
  "author": "Leo Balter",
  "date": "2019-11-13 15:33:46 -0800",
  "hash": "abb7cbda7d2134635738f2e3f759571349908a10",
  "parents": "8fd2e014fa52a1c932686904a7b46eb742fe3112",
  "subject": "Normative: CreateDynamicFunction early concatenates bodyText (#1479)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-13 11:42:33 -0800",
  "hash": "8fd2e014fa52a1c932686904a7b46eb742fe3112",
  "parents": "37728d736e9e6a1e2ba951dbeb3fc096914193d6",
  "subject": "Editorial: `GetSubstitution` usage: can not throw when `namedCaptures` is undefined"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-13 11:42:33 -0800",
  "hash": "8fd2e014fa52a1c932686904a7b46eb742fe3112",
  "parents": "37728d736e9e6a1e2ba951dbeb3fc096914193d6",
  "subject": "Editorial: `GetSubstitution` usage: can not throw when `namedCaptures` is undefined"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-13 11:31:56 -0800",
  "hash": "37728d736e9e6a1e2ba951dbeb3fc096914193d6",
  "parents": "05b9dbf682b47db009e8b65e89273aaa05d72d74",
  "subject": "Editorial: `GetSubstitution` usage: fix spec bug introduced in #1580"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-11-13 11:15:58 -0800",
  "hash": "05b9dbf682b47db009e8b65e89273aaa05d72d74",
  "parents": "143752135131e0318ea65e8ca70b82c98103890f",
  "subject": "Editorial: Move ToObject out of GetSubstitution (#1580)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-12 12:06:50 -0800",
  "hash": "143752135131e0318ea65e8ca70b82c98103890f",
  "parents": "b9fd178fa9ff28532f8e8a7a4c63421454bdeed4",
  "subject": "[meta] IPR: travis-ci has the branch as \"master\" on PRs too"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-11 17:01:31 -0800",
  "hash": "b9fd178fa9ff28532f8e8a7a4c63421454bdeed4",
  "parents": "39d873e203bb3ca376d3fd297d1e1cf7385255f2",
  "subject": "[meta] the IPR check only works on master for the time being"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-11 17:01:31 -0800",
  "hash": "39d873e203bb3ca376d3fd297d1e1cf7385255f2",
  "parents": "d1b6707fdf2d0beee605db9e7e9df1602f1575b5",
  "subject": "[meta] improved error reporting in check-form script"
 },
 {
  "author": "chicoxyzzy",
  "date": "2019-11-08 15:21:00 -0800",
  "hash": "d1b6707fdf2d0beee605db9e7e9df1602f1575b5",
  "parents": "17ff6d5d31b70e0544f7863d25650ea4d0a04703",
  "subject": "Editorial: Add BigInt to the list of primitive values (#1769)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-11-06 16:25:40 -0800",
  "hash": "17ff6d5d31b70e0544f7863d25650ea4d0a04703",
  "parents": "e97c95d064750fb949b6778584702dd658cf5624",
  "subject": "Meta: add IPR checking script"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-29 21:58:47 -0700",
  "hash": "e97c95d064750fb949b6778584702dd658cf5624",
  "parents": "7fc703fd7e4241c103d9c2187033a90a984905d4",
  "subject": "Editorial: Refactor index checking for Integer-Indexed exotic objects (#1752)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-26 21:11:58 -0700",
  "hash": "7fc703fd7e4241c103d9c2187033a90a984905d4",
  "parents": "34ae511e178a51ae4da5bcb75b7aaef549ae4dde",
  "subject": "Editorial: Move \"Boolean ( . . . )\" clause (#1762)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-10-26 14:26:02 -0700",
  "hash": "34ae511e178a51ae4da5bcb75b7aaef549ae4dde",
  "parents": "2bfd9c8892023b9388c5672323105b18718cfdc4",
  "subject": "Normative: Make BigInt a global (#1753)"
 },
 {
  "author": "Andrew Paprocki",
  "date": "2019-10-24 19:52:59 -0700",
  "hash": "2bfd9c8892023b9388c5672323105b18718cfdc4",
  "parents": "725492e942ef07ad989e95b960ceea7a989cc68e",
  "subject": "Normative: Restore BigInt.prototype.toJSON (#1756)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-23 20:30:56 -0700",
  "hash": "725492e942ef07ad989e95b960ceea7a989cc68e",
  "parents": "f619e92371f04bfeaaaeab7bcc754e3f8f5c8fda",
  "subject": "Editorial: Move code from FunctionAllocate to MakeConstructor (#1546)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-23 20:30:56 -0700",
  "hash": "f619e92371f04bfeaaaeab7bcc754e3f8f5c8fda",
  "parents": "1595e86b09414b669fcdd23e576ec912685d5f2b",
  "subject": "Editorial: [[FunctionKind]] -> [[IsClassConstructor]] (#1546)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-21 15:21:26 -0700",
  "hash": "1595e86b09414b669fcdd23e576ec912685d5f2b",
  "parents": "55707d0c15a23834baca2a440d61ae5a929d589c",
  "subject": "Markup: fix a malformed <emu-xref> tag (#1750)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-21 15:21:26 -0700",
  "hash": "1595e86b09414b669fcdd23e576ec912685d5f2b",
  "parents": "55707d0c15a23834baca2a440d61ae5a929d589c",
  "subject": "Markup: fix a malformed <emu-xref> tag (#1750)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-10-18 22:51:56 -0700",
  "hash": "55707d0c15a23834baca2a440d61ae5a929d589c",
  "parents": "b1593ecc3653c9445a23dd63d6008ee2b3808c81",
  "subject": "Editorial: Represent strings as values (#1733)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-18 12:44:09 -0700",
  "hash": "b1593ecc3653c9445a23dd63d6008ee2b3808c81",
  "parents": "214298cac120a4974668562959478e2ce7cee73e",
  "subject": "Editorial: update Annex E with incompatibilities from previous editions (#1698)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-18 12:44:09 -0700",
  "hash": "214298cac120a4974668562959478e2ce7cee73e",
  "parents": "05d3fdc9a8213da6f4d6aade8707150d2a664cc4",
  "subject": "Editorial: add `<dfn>`s for \"Job\" and \"Job Queue\" (#1698)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-10-17 20:34:06 -0700",
  "hash": "05d3fdc9a8213da6f4d6aade8707150d2a664cc4",
  "parents": "02b37cdbf2a599a37f77c82f38d5146836ec84e1",
  "subject": "Normative: add missing ContainsUseStrict definition for AsyncConciseBody (#1745)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-17 16:58:00 -0700",
  "hash": "02b37cdbf2a599a37f77c82f38d5146836ec84e1",
  "parents": "3c91467d4a97a04c018d44a79e88f26dee276f7a",
  "subject": "Editorial: Add note to AsyncFunctionStart justifying the context copy"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-17 16:55:01 -0700",
  "hash": "3c91467d4a97a04c018d44a79e88f26dee276f7a",
  "parents": "af5965848a61866d7009c2e1139bd97c497f0280",
  "subject": "Revert \"Editorial: remove context copy from AsyncFunctionStart (#1685)\" (#1748)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-10-17 15:33:33 -0700",
  "hash": "af5965848a61866d7009c2e1139bd97c497f0280",
  "parents": "1369749caf540a63b6be9444dd064e2af6bfb94e",
  "subject": "Editorial: find Directive Prologue in appropriate node in IsStrict/ContainsUseStrict (#1746)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-10-17 15:25:44 -0700",
  "hash": "1369749caf540a63b6be9444dd064e2af6bfb94e",
  "parents": "809c84be1b11744ef4c4f1a51947e4a1a62cc844",
  "subject": "Editorial: rename cxt/ctx variables to context; remove unnecessary \"the\"s (#1740)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-10-17 15:23:02 -0700",
  "hash": "809c84be1b11744ef4c4f1a51947e4a1a62cc844",
  "parents": "e9faaa18253f2d6dc063f4cb3c4cf481e8f4f849",
  "subject": "Editorial: reword only use of \"_x_'s Y component\" (#1743)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-10-17 11:03:50 -0700",
  "hash": "e9faaa18253f2d6dc063f4cb3c4cf481e8f4f849",
  "parents": "712b03b6c0deb7082b784f54b2b3adfbe6dd33e3",
  "subject": "Editorial: remove context copy from AsyncFunctionStart (#1685)"
 },
 {
  "author": "Jason Orendorff",
  "date": "2019-10-17 10:54:47 -0700",
  "hash": "712b03b6c0deb7082b784f54b2b3adfbe6dd33e3",
  "parents": "d4e4f44429fb6a1fdee02bad67eac87766572a0c",
  "subject": "Editorial: Remove the |Keyword| nonterminal (#1694)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-10-15 23:19:06 -0700",
  "hash": "d4e4f44429fb6a1fdee02bad67eac87766572a0c",
  "parents": "cf8607eb1350b8f67f4d5742c43b22f224dd8ae6",
  "subject": "Editorial: Stylize \"this object\" consistently (#1736)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-10-15 22:33:07 -0700",
  "hash": "cf8607eb1350b8f67f4d5742c43b22f224dd8ae6",
  "parents": "4310852efaa263b4a9776cdb9257e64124770061",
  "subject": "Editorial: Use consistent notation for code units (#1724)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-11 22:49:21 -0700",
  "hash": "4310852efaa263b4a9776cdb9257e64124770061",
  "parents": "732fea960682a062652434a1d841e9ea6554fb2d",
  "subject": "Editorial: Delete two unused sentences (#1734)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-11 22:49:21 -0700",
  "hash": "732fea960682a062652434a1d841e9ea6554fb2d",
  "parents": "b68d0b2d65d06c263a8b8f1371812f91c88ffc4f",
  "subject": "Editorial: fix bug/inconsistency by inserting \"Element Type\" (#1734)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-11 22:49:21 -0700",
  "hash": "b68d0b2d65d06c263a8b8f1371812f91c88ffc4f",
  "parents": "d38fde98d14818de249478008b6778b5ea7a3bd8",
  "subject": "Editorial: use consistent wording re Element Size (#1734)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-11 22:49:21 -0700",
  "hash": "d38fde98d14818de249478008b6778b5ea7a3bd8",
  "parents": "ce66e8ff5ba61bfb632056aeab5eff3dab594519",
  "subject": "Markup: A proper id for \"The TypedArray Constructors\" table (#1734)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-10-10 19:48:19 -0700",
  "hash": "ce66e8ff5ba61bfb632056aeab5eff3dab594519",
  "parents": "fa8e6b3ec1e94b3d1e7455da877495a32e742134",
  "subject": "Editorial: Use tildes for spec-internal values wherever possible (#1725)"
 },
 {
  "author": "Timothy Gu",
  "date": "2019-10-10 15:57:25 -0700",
  "hash": "fa8e6b3ec1e94b3d1e7455da877495a32e742134",
  "parents": "6f32d3e5a62b4f66418f21aad606b2257b865282",
  "subject": "Editorial: Regroup IterationStatement static semantics (#1284)"
 },
 {
  "author": "Timothy Gu",
  "date": "2019-10-10 15:56:21 -0700",
  "hash": "6f32d3e5a62b4f66418f21aad606b2257b865282",
  "parents": "ed0b5966c51699b1d430d88623ea8999146f3693",
  "subject": "Editorial: Remove incorrect duplicated VarScopedDeclarations static semantic for IterationStatement (#1284)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-10-10 11:13:30 -0700",
  "hash": "ed0b5966c51699b1d430d88623ea8999146f3693",
  "parents": "435306ad232fbc211a528b250fe57d0b78a41667",
  "subject": "replace es-discuss link in CONTRIBUTING with discourse link (#1726)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-08 20:09:27 -0700",
  "hash": "435306ad232fbc211a528b250fe57d0b78a41667",
  "parents": "068f7a6d842d3e35a50a6b28acfec6d2ebca852d",
  "subject": "[meta] fix ecmarkup rendering; inline HTML comments seem to break it"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-10-08 19:30:22 -0700",
  "hash": "068f7a6d842d3e35a50a6b28acfec6d2ebca852d",
  "parents": "df54f3561f8bdb59ff6231fb4b3fc3528f40222e",
  "subject": "Editorial: Reference DecimalDigit rather than duplicating its RHS (#1728)"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-10-08 19:26:32 -0700",
  "hash": "df54f3561f8bdb59ff6231fb4b3fc3528f40222e",
  "parents": "f7a13651f4801918e02d12b96d49e14caf58f544",
  "subject": "Editorial: Better relate ECMAScript time values to POSIX and UTC (#1325)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-08 17:01:37 -0700",
  "hash": "f7a13651f4801918e02d12b96d49e14caf58f544",
  "parents": "98813bcb6c865932048677f918a16fa7fa9cccdc",
  "subject": "[meta] use an HTML comment to avoid auto-dfn-linking (#1731)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-06 10:30:10 -0700",
  "hash": "98813bcb6c865932048677f918a16fa7fa9cccdc",
  "parents": "693e09a4b9ce52b060ceda897b042c3f83f0a738",
  "subject": "Editorial: more cleanups from previous PRs (#1722)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-06 10:30:10 -0700",
  "hash": "98813bcb6c865932048677f918a16fa7fa9cccdc",
  "parents": "693e09a4b9ce52b060ceda897b042c3f83f0a738",
  "subject": "Editorial: more cleanups from previous PRs (#1722)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-10-04 09:56:43 -0400",
  "hash": "693e09a4b9ce52b060ceda897b042c3f83f0a738",
  "parents": "bb11ca51a13f72219e057518de16ad5ea8563872",
  "subject": "Editorial: Improve note on forcing string comparison (#1526)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-10-04 09:56:43 -0400",
  "hash": "693e09a4b9ce52b060ceda897b042c3f83f0a738",
  "parents": "bb11ca51a13f72219e057518de16ad5ea8563872",
  "subject": "Editorial: Improve note on forcing string comparison (#1526)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-04 09:54:10 -0400",
  "hash": "bb11ca51a13f72219e057518de16ad5ea8563872",
  "parents": "85fbd828dae51cede83df1f6b254249e868fd05c",
  "subject": "Editorial: Rephrase \"ListIterator next\" (#1641)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2019-10-04 09:52:25 -0400",
  "hash": "85fbd828dae51cede83df1f6b254249e868fd05c",
  "parents": "fc218876e478dafb8e819cfafddd25abcf98c86a",
  "subject": "Editorial: Improve %JSONStringify% intrinsic definition (#1684)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-10-04 09:49:11 -0400",
  "hash": "fc218876e478dafb8e819cfafddd25abcf98c86a",
  "parents": "2c5fba058a5f433baa6b88e5acc2f15fd52363ea",
  "subject": "Editorial: Quote properties consistently (#1302)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-03 23:29:48 -0400",
  "hash": "2c5fba058a5f433baa6b88e5acc2f15fd52363ea",
  "parents": "2b6696b892df3764d69e5c678dfbbeaf261d8ab3",
  "subject": "Editorial: fix intrinsic notation from previous PRs (#1720)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-10-03 23:09:38 -0400",
  "hash": "2b6696b892df3764d69e5c678dfbbeaf261d8ab3",
  "parents": "1e00ac27782fcdcbf02724f16d0f9cb1fdbdd775",
  "subject": "Editorial: fix and improve definition of %ThrowTypeError% (#1635)"
 },
 {
  "author": "T.J. Crowder",
  "date": "2019-10-03 21:32:21 -0400",
  "hash": "1e00ac27782fcdcbf02724f16d0f9cb1fdbdd775",
  "parents": "5e9e48fa7de7a2d9f310e36efcc399e0bf96741c",
  "subject": "Editorial: say what the draft represents"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-03 20:59:51 -0400",
  "hash": "5e9e48fa7de7a2d9f310e36efcc399e0bf96741c",
  "parents": "1d0fe7c85c8f81a4ea301498ac036a8ef37a2a3d",
  "subject": "Editorial: use `! CreateDataPropertyOrThrow` instead of `CreateDataProperty` and an assert (#1676)"
 },
 {
  "author": "Mathias Bynens",
  "date": "2019-10-03 15:34:34 -0400",
  "hash": "1d0fe7c85c8f81a4ea301498ac036a8ef37a2a3d",
  "parents": "ad1adc8b1cab4cd51216c583d1a9b880a29ece60",
  "subject": "Normative: make `String.prototype.matchAll` throw for non-global regular expressions (#1716)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-02 16:15:09 -0400",
  "hash": "ad1adc8b1cab4cd51216c583d1a9b880a29ece60",
  "parents": "4374762005846b779d1cc4f03aeababe41af0e79",
  "subject": "[meta] clarify gitignore comment"
 },
 {
  "author": "Valerie R Young",
  "date": "2019-10-02 12:41:08 -0400",
  "hash": "4374762005846b779d1cc4f03aeababe41af0e79",
  "parents": "5b019725a7ff10757c8bb2ffe4a1f32563be7bf0",
  "subject": "Normative: Add `export * as ns from \"mod\u201d` (#1174)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-10-02 11:13:07 -0400",
  "hash": "5b019725a7ff10757c8bb2ffe4a1f32563be7bf0",
  "parents": "d7642235f9c6ae0c250d117c0ec39a77727b1741",
  "subject": "Normative: add `globalThis` (#702)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-02 11:01:37 -0400",
  "hash": "d7642235f9c6ae0c250d117c0ec39a77727b1741",
  "parents": "a8a22db2e35dbe35e4d96c7f8f366908519b59c5",
  "subject": "Editorial: Remove unused AO SynchronizeEventSet (#1692)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-02 11:01:37 -0400",
  "hash": "a8a22db2e35dbe35e4d96c7f8f366908519b59c5",
  "parents": "f8e028bac2de013a18465d97d8d350f7f3e48875",
  "subject": "Normative: Make the Atomics critical section imply synchronizes-with (#1680)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-10-01 22:36:52 -0400",
  "hash": "f8e028bac2de013a18465d97d8d350f7f3e48875",
  "parents": "bdcd53150ef7c49d53347e1fe124e965850ca474",
  "subject": "Editorial: fixes from #1124: spaces around operator; Let -> Set (#1714)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-10-01 14:06:53 -0400",
  "hash": "bdcd53150ef7c49d53347e1fe124e965850ca474",
  "parents": "20706ef77f8d4f9aa149412695363fc69e62ea88",
  "subject": "Normative: Remove ToUint32 from array literal evaluation (#1124)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-10-01 14:06:53 -0400",
  "hash": "bdcd53150ef7c49d53347e1fe124e965850ca474",
  "parents": "20706ef77f8d4f9aa149412695363fc69e62ea88",
  "subject": "Normative: Remove ToUint32 from array literal evaluation (#1124)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-10-01 10:22:24 -0400",
  "hash": "20706ef77f8d4f9aa149412695363fc69e62ea88",
  "parents": "c5ee9095003dcffb11e8887f566994da24421dd8",
  "subject": "Normative: Fix bogus assert in NotifyWaiter (#1712)"
 },
 {
  "author": "Gabriel Kennedy",
  "date": "2019-10-01 10:07:42 -0400",
  "hash": "c5ee9095003dcffb11e8887f566994da24421dd8",
  "parents": "83621dece9b633f97100ee3d0dce557836a26696",
  "subject": "[meta] Corrected typo in contributing.md (#1679)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-09-30 23:26:21 -0400",
  "hash": "83621dece9b633f97100ee3d0dce557836a26696",
  "parents": "a09c766166c848f4ab6efe73165067ed0192deb4",
  "subject": "Editorial: Fix null [[ScriptOrModule]] of function declarations in modules (#1670)"
 },
 {
  "author": "Caio Lima",
  "date": "2019-09-30 13:24:12 -0700",
  "hash": "a09c766166c848f4ab6efe73165067ed0192deb4",
  "parents": "fe7f4c0a13a03dc54578e7a335f85cf73d9f68d2",
  "subject": "Normative: Changing 'SetViewValue' to use 'ToNumber' instead of 'ToInteger' (#1708)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-28 09:15:56 -0700",
  "hash": "fe7f4c0a13a03dc54578e7a335f85cf73d9f68d2",
  "parents": "55c611de44da644c74a8dadc1faf594685ce41be",
  "subject": "Editorial: more cleanup from #1515 (#1705)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-27 21:58:12 -0700",
  "hash": "55c611de44da644c74a8dadc1faf594685ce41be",
  "parents": "dc00d4df17e860704783bed0b7f19b2a40b56d88",
  "subject": "Editorial: cleanups from #1515 (#1704)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-27 21:58:12 -0700",
  "hash": "dc00d4df17e860704783bed0b7f19b2a40b56d88",
  "parents": "67442028c348e4d46ced1880570244ee81964a7b",
  "subject": "Editorial: minor tweaks to algorithm syntax (#1704)"
 },
 {
  "author": "Jason Williams",
  "date": "2019-09-27 00:12:45 -0700",
  "hash": "67442028c348e4d46ced1880570244ee81964a7b",
  "parents": "fd3a2604fd00e45e524553614c75aef77bc46a80",
  "subject": "Normative: add `Promise.allSettled` (#1583)"
 },
 {
  "author": "Caio Lima",
  "date": "2019-09-26 23:59:12 -0700",
  "hash": "fd3a2604fd00e45e524553614c75aef77bc46a80",
  "parents": "73d34e8b51ad897c58f65c4df1e80b7be8653b2d",
  "subject": "Normative: Add new BigInt type (#1515)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-22 22:39:11 -0700",
  "hash": "73d34e8b51ad897c58f65c4df1e80b7be8653b2d",
  "parents": "3f84341321b84d0e6eef5dbf3ca3d2df04e2a4f7",
  "subject": "Editorial: Change ES 2019 para to past tense (#1503)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-22 22:39:11 -0700",
  "hash": "3f84341321b84d0e6eef5dbf3ca3d2df04e2a4f7",
  "parents": "537352b4f32c7b34fac2dcf1c414645fa2e9c80b",
  "subject": "Editorial: ES 2020 is the eleventh edition (#1503)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-09-21 16:30:47 -0700",
  "hash": "537352b4f32c7b34fac2dcf1c414645fa2e9c80b",
  "parents": "65147d85d3f5e77782d382c8d40cdbb4158bd53c",
  "subject": "Editorial: Spell out fairness requirements of EnterCriticalSection (#1696)"
 },
 {
  "author": "Shu-yu Guo",
  "date": "2019-09-21 16:26:26 -0700",
  "hash": "65147d85d3f5e77782d382c8d40cdbb4158bd53c",
  "parents": "a86c79eb92a676cb3b61540c74e26c35a29ef4da",
  "subject": "Editorial: Define critical section (#1695)"
 },
 {
  "author": "Kriyszig",
  "date": "2019-09-21 16:03:37 -0700",
  "hash": "a86c79eb92a676cb3b61540c74e26c35a29ef4da",
  "parents": "c20a1e7b8f269443afb77ff4451f2c47fa55cb00",
  "subject": "Editorial: Fixed typo in spec (#1648)"
 },
 {
  "author": "Andrew Paprocki",
  "date": "2019-09-21 14:28:24 -0700",
  "hash": "c20a1e7b8f269443afb77ff4451f2c47fa55cb00",
  "parents": "0a5db75f25d82f6df812cef98448794633543388",
  "subject": "Editorial: LocalTZA input specification (#1160)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-16 13:43:27 -0700",
  "hash": "0a5db75f25d82f6df812cef98448794633543388",
  "parents": "f2d550e8dba0dfe5847b76c960bddb2151259407",
  "subject": "Editorial: Fix Annex B step number reference (#1636)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-16 13:43:26 -0700",
  "hash": "f2d550e8dba0dfe5847b76c960bddb2151259407",
  "parents": "2ddbf3770e9a719f5c74143be3b76a3cc95141bb",
  "subject": "Editorial: use more new-style intrinsic-names (#1636)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-16 13:43:26 -0700",
  "hash": "2ddbf3770e9a719f5c74143be3b76a3cc95141bb",
  "parents": "9c0749b89d110e9f1848f7f899744713f785b97b",
  "subject": "Markup: reinstate some <var> tags (#1636)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-16 13:43:26 -0700",
  "hash": "9c0749b89d110e9f1848f7f899744713f785b97b",
  "parents": "67bfb31681b5a5d5b62c819d7db42e268f9bef31",
  "subject": "Editorial: insert '!' and '?'; fix incorrect intrinsic names (#1636)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-09-16 13:43:26 -0700",
  "hash": "67bfb31681b5a5d5b62c819d7db42e268f9bef31",
  "parents": "fcae34e3177d8e0cffe0d495bc75b3a7b9f94048",
  "subject": "Editorial: Append '.' to step (#1636)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-09-05 23:08:52 -0700",
  "hash": "fcae34e3177d8e0cffe0d495bc75b3a7b9f94048",
  "parents": "85f905aff137a7f0872c48e16d6b883b7b46212a",
  "subject": "[meta] update editors list for ES2020"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-09-04 22:09:33 -0700",
  "hash": "85f905aff137a7f0872c48e16d6b883b7b46212a",
  "parents": "e94a1ec690c4db5365bdf3b725cf9ddc89084eaf",
  "subject": "[meta] add snapshot builds (#1525)"
 },
 {
  "author": "Gus Caplan",
  "date": "2019-09-04 22:09:33 -0700",
  "hash": "85f905aff137a7f0872c48e16d6b883b7b46212a",
  "parents": "e94a1ec690c4db5365bdf3b725cf9ddc89084eaf",
  "subject": "[meta] add snapshot builds (#1525)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-09-04 22:09:32 -0700",
  "hash": "e94a1ec690c4db5365bdf3b725cf9ddc89084eaf",
  "parents": "d417f5d3002363afd00fa447e075d27cc289dc29",
  "subject": "[meta] disable creation of gitignored package-lock"
 },
 {
  "author": "Domenic Denicola",
  "date": "2019-08-18 00:03:20 -0700",
  "hash": "d417f5d3002363afd00fa447e075d27cc289dc29",
  "parents": "8f0f69279b5f9e12ebe8f7052322b93d17e36b54",
  "subject": "Normative: change idempotency for HostImportModuleDynamically (#1645)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-08-07 15:50:33 -0700",
  "hash": "8f0f69279b5f9e12ebe8f7052322b93d17e36b54",
  "parents": "3440ecbca405632e4ffda1028b70c3e19485d919",
  "subject": "Normative: Disallow internal methods returning continue|break|return (#1539)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-08-07 15:50:33 -0700",
  "hash": "3440ecbca405632e4ffda1028b70c3e19485d919",
  "parents": "1f2191b57fdfd5b1162d8dbfd41d6de67ca82e36",
  "subject": "Editorial: Add some missing 'return value' invariants (#1539)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-08-07 15:50:33 -0700",
  "hash": "1f2191b57fdfd5b1162d8dbfd41d6de67ca82e36",
  "parents": "f1b22ef430455201eae1d932a272d4a8d1969886",
  "subject": "Editorial: Break up a long para in \"Object Internal Methods and Internal Slots\" (#1539)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-08-07 15:50:33 -0700",
  "hash": "8f0f69279b5f9e12ebe8f7052322b93d17e36b54",
  "parents": "3440ecbca405632e4ffda1028b70c3e19485d919",
  "subject": "Normative: Disallow internal methods returning continue|break|return (#1539)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-08-07 15:22:36 -0700",
  "hash": "f1b22ef430455201eae1d932a272d4a8d1969886",
  "parents": "c1c192cedd305564561a0afeacbaa34cd2ab457c",
  "subject": "Editorial: define and use improved intrinsics notation (#1376)"
 },
 {
  "author": "Dhruv Jain",
  "date": "2019-08-07 15:21:46 -0700",
  "hash": "c1c192cedd305564561a0afeacbaa34cd2ab457c",
  "parents": "a68d1296f156ff73075fde36aebd643de4f8ebde",
  "subject": "[meta] fix link to TC39 meetings (#1638)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-19 08:55:24 -0700",
  "hash": "a68d1296f156ff73075fde36aebd643de4f8ebde",
  "parents": "a380fa7547be3bfe6fa66824252a63fa6e3980d3",
  "subject": "Editorial: `parseFloat`/`parseInt`: fix unintentional normative change from #1629 (#1634)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-19 08:55:24 -0700",
  "hash": "a68d1296f156ff73075fde36aebd643de4f8ebde",
  "parents": "a380fa7547be3bfe6fa66824252a63fa6e3980d3",
  "subject": "Editorial: `parseFloat`/`parseInt`: fix unintentional normative change from #1629 (#1634)"
 },
 {
  "author": "Sergey Rubanov",
  "date": "2019-07-17 23:50:46 -0700",
  "hash": "a380fa7547be3bfe6fa66824252a63fa6e3980d3",
  "parents": "7b1e75ce83a5ca1bbe7f26e2cf00dc0d6bd95e7d",
  "subject": "Meta: Add Stage 1 proposals list (#1633)"
 },
 {
  "author": "Kriyszig",
  "date": "2019-07-17 23:30:51 -0700",
  "hash": "7b1e75ce83a5ca1bbe7f26e2cf00dc0d6bd95e7d",
  "parents": "7f3d00203d4aecca69c39ea5252bd73df7c862b6",
  "subject": "Editorial: Fixed typo in Shared Memory Guidelines note (#1631)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-07-17 23:28:59 -0700",
  "hash": "7f3d00203d4aecca69c39ea5252bd73df7c862b6",
  "parents": "21350fc83fd86d00c6585e5783c5bc9c14b969d0",
  "subject": "Meta: Refactor package.json scripts to use prebuild (#1627)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-17 23:24:20 -0700",
  "hash": "21350fc83fd86d00c6585e5783c5bc9c14b969d0",
  "parents": "9226f3c662527872174b8dd77558a3da0b4bccee",
  "subject": "Editorial: fix capitalization of \"RegExp String Iterator\" (#1626)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-17 23:22:16 -0700",
  "hash": "9226f3c662527872174b8dd77558a3da0b4bccee",
  "parents": "4bac90f15853cc029abd8a418292c9bd73417cff",
  "subject": "Editorial: Use `!` on calls to `ToBoolean` (#1622)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-17 23:21:22 -0700",
  "hash": "4bac90f15853cc029abd8a418292c9bd73417cff",
  "parents": "7c5186eb5a21ec3fe597f890c810ddf8bdbb1032",
  "subject": "Editorial: `FlattenIntoArray`: add assertions (#1620)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-17 23:17:46 -0700",
  "hash": "7c5186eb5a21ec3fe597f890c810ddf8bdbb1032",
  "parents": "81eb1f42fae4f34037a1070eb8a914d6e057d7d5",
  "subject": "Editorial: Define + use LengthOfArrayLike operation (#1616)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2019-07-17 23:16:27 -0700",
  "hash": "81eb1f42fae4f34037a1070eb8a914d6e057d7d5",
  "parents": "3d02e63fc543b1351f8757d1667a8b9d5cd83deb",
  "subject": "Editorial: Add note on [[Delete]] in InternalizeJSONProperty (#1615)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2019-07-17 23:12:40 -0700",
  "hash": "3d02e63fc543b1351f8757d1667a8b9d5cd83deb",
  "parents": "d25060ea11703d0b6385ca82b822567e26e29e0f",
  "subject": "Editorial: Tweak ValidateAndApplyPropertyDescriptor (#1614)"
 },
 {
  "author": "Timothy Gu",
  "date": "2019-07-17 23:10:38 -0700",
  "hash": "d25060ea11703d0b6385ca82b822567e26e29e0f",
  "parents": "380518a1123bb75b5a2e3b95562f22524bc134ae",
  "subject": "Editorial: Some small formatting tweaks (#1613)"
 },
 {
  "author": "chicoxyzzy",
  "date": "2019-07-17 23:08:54 -0700",
  "hash": "380518a1123bb75b5a2e3b95562f22524bc134ae",
  "parents": "37d12edde81a5ccbbe3fe1aec48dc264d406b9e4",
  "subject": "Editorial: Add `!`/`?` before CreateBuiltinFunction and CreateArrayFromList (#1607)"
 },
 {
  "author": "Alexey Shvayka",
  "date": "2019-07-17 23:05:02 -0700",
  "hash": "37d12edde81a5ccbbe3fe1aec48dc264d406b9e4",
  "parents": "56b2ea9d6fec743f8922180fcdd45c8e72074995",
  "subject": "Editorial: Replace usages of \"add\" and \"subtract\" with \"set\" (#1604)"
 },
 {
  "author": "Rick Waldron",
  "date": "2019-07-17 23:02:44 -0700",
  "hash": "56b2ea9d6fec743f8922180fcdd45c8e72074995",
  "parents": "9d8a968631cdec5db4a4aada57d0c7a34a4830c3",
  "subject": "Editorial: \"_@@toStringTag_\" -> \"@@toStringTag\" in %RegExpStringIteratorPrototype% (#1601)"
 },
 {
  "author": "Rick Waldron",
  "date": "2019-07-17 22:57:54 -0700",
  "hash": "9d8a968631cdec5db4a4aada57d0c7a34a4830c3",
  "parents": "560ce69773cac638aa5710604e9562f7149450bf",
  "subject": "Editorial: Fix misformatted occurences of things that are \"string values\" (#1592)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-17 22:54:40 -0700",
  "hash": "560ce69773cac638aa5710604e9562f7149450bf",
  "parents": "482891adc2eeaef810c4035f279ab7d17fa6d99e",
  "subject": "Editorial: Fix typo: \"module\" -> \"script\" (#1582)"
 },
 {
  "author": "Anne van Kesteren",
  "date": "2019-07-17 22:53:29 -0700",
  "hash": "482891adc2eeaef810c4035f279ab7d17fa6d99e",
  "parents": "2b067ead5c9e81501439ed14742916747521aba5",
  "subject": "Editorial: align formatting of metadata block (#1574)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-07-17 22:50:09 -0700",
  "hash": "2b067ead5c9e81501439ed14742916747521aba5",
  "parents": "446956adc3db3cc500d2a7c53dfe2561a8a2e2f9",
  "subject": "Editorial: normalise wording used to apply syntax-directed operations (#1571)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-07-17 22:48:11 -0700",
  "hash": "446956adc3db3cc500d2a7c53dfe2561a8a2e2f9",
  "parents": "67a345a76cfc3c48488d464a0af15a37421cee94",
  "subject": "Normative: set [[SourceText]] in NamedEvaluation of ClassExpression (#1569)"
 },
 {
  "author": "Ms2ger",
  "date": "2019-07-17 22:46:40 -0700",
  "hash": "67a345a76cfc3c48488d464a0af15a37421cee94",
  "parents": "f62be461027cc715ed6145857ba104f29f71367b",
  "subject": "Editorial: Correct the alt text of an image (#1568)"
 },
 {
  "author": "Kriyszig",
  "date": "2019-07-16 23:04:46 -0700",
  "hash": "f62be461027cc715ed6145857ba104f29f71367b",
  "parents": "6ea24e1b1073526e67d1022c9a8f9d51f2eb2583",
  "subject": "Editorial: Added %RegExpStringIteratorPrototype% to object table (#1625)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-14 21:38:52 -0700",
  "hash": "6ea24e1b1073526e67d1022c9a8f9d51f2eb2583",
  "parents": "5c9339cc51b0d8d9c428d48b9d3dc4798d265340",
  "subject": "Editorial: '_trimmedString_' -> '_S_' in parseInt (#1629)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-14 11:10:28 -0700",
  "hash": "5c9339cc51b0d8d9c428d48b9d3dc4798d265340",
  "parents": "ceb31abac791fee3602082a7c82c1526438b8d4c",
  "subject": "Editorial: use \"be the *this* value\" over \"be *this* value\" (#1603)"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-07-14 11:06:03 -0700",
  "hash": "ceb31abac791fee3602082a7c82c1526438b8d4c",
  "parents": "8fbad3e3fd0080819bae9cf1cf96bd392bb97217",
  "subject": "Editorial: use `TrimString` in `parseFloat` and `parseInt` (#1602)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-14 11:04:17 -0700",
  "hash": "8fbad3e3fd0080819bae9cf1cf96bd392bb97217",
  "parents": "e2d1e3609560e6512be24e1361c869147c54e85d",
  "subject": "Editorial: Change \"?\" to \"!\" before CreateAsyncFromSyncIterator (#1596)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-14 11:04:16 -0700",
  "hash": "e2d1e3609560e6512be24e1361c869147c54e85d",
  "parents": "bf4deed9f7cc09f4fa3906f16e33dfe034b8fd39",
  "subject": "Editorial: Restructure 2 syntax-directed rules (#1596)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-07-14 11:04:16 -0700",
  "hash": "bf4deed9f7cc09f4fa3906f16e33dfe034b8fd39",
  "parents": "dc1e21c454bd316810be1c0e7af0131a2d7f38e9",
  "subject": "Editorial: Delete comma after \"else\" (#1596)"
 },
 {
  "author": "Caio Lima",
  "date": "2019-07-03 23:13:15 -0700",
  "hash": "dc1e21c454bd316810be1c0e7af0131a2d7f38e9",
  "parents": "890b1033876795be14f1488f2756db4ecebcdf25",
  "subject": "Meta: Changing charset to UTF-8 (#1135)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-07-03 23:13:15 -0700",
  "hash": "890b1033876795be14f1488f2756db4ecebcdf25",
  "parents": "a95e95a63bc1fd7d71f089ad1d68be0cce4caf34",
  "subject": "Editorial: Explicitly note mathematical values (#1135)"
 },
 {
  "author": "Caio Lima",
  "date": "2019-07-03 23:13:15 -0700",
  "hash": "dc1e21c454bd316810be1c0e7af0131a2d7f38e9",
  "parents": "890b1033876795be14f1488f2756db4ecebcdf25",
  "subject": "Meta: Changing charset to UTF-8 (#1135)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-06-19 14:40:18 -0700",
  "hash": "a95e95a63bc1fd7d71f089ad1d68be0cce4caf34",
  "parents": "3654a4f6954e6bfb4715484d0dc3370c25170d5c",
  "subject": "Normative: Let all early errors be SyntaxErrors (#1527)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-06-19 14:40:18 -0700",
  "hash": "a95e95a63bc1fd7d71f089ad1d68be0cce4caf34",
  "parents": "3654a4f6954e6bfb4715484d0dc3370c25170d5c",
  "subject": "Normative: Let all early errors be SyntaxErrors (#1527)"
 },
 {
  "author": "Mike Pennisi",
  "date": "2019-06-19 14:36:05 -0700",
  "hash": "3654a4f6954e6bfb4715484d0dc3370c25170d5c",
  "parents": "1245393a97add44b7ca832366d7df79da30d9a98",
  "subject": "Normative: Extend definition of \"function code\" (#1158)"
 },
 {
  "author": "Andr\u00e9 Bargull",
  "date": "2019-06-19 14:25:16 -0700",
  "hash": "1245393a97add44b7ca832366d7df79da30d9a98",
  "parents": "49b1071eef0085947e75eb22bc3f658082441b82",
  "subject": "Normative: Make Async-from-Sync iterator object inaccessible to ECMAScript code"
 },
 {
  "author": "Jordan Harband",
  "date": "2019-06-16 23:05:38 -0700",
  "hash": "49b1071eef0085947e75eb22bc3f658082441b82",
  "parents": "b8003a5510c2027a41cf08fc86b176bfe0b29af4",
  "subject": "[meta] ensure deploy script does not fail on forks"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-06-16 23:00:34 -0700",
  "hash": "b8003a5510c2027a41cf08fc86b176bfe0b29af4",
  "parents": "3bc01d4feead6cdf3e0be27b757ebc8644fe080e",
  "subject": "Editorial: consistent spacing/commas/wording/encoding/ecmarkup (#1566)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-06-16 22:45:56 -0700",
  "hash": "3bc01d4feead6cdf3e0be27b757ebc8644fe080e",
  "parents": "c2f8d3e84f29b35861a7e63a7093a05b5372cabc",
  "subject": "Editorial: centralize strictness for function defs (#1563)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-06-15 22:02:03 -0700",
  "hash": "c2f8d3e84f29b35861a7e63a7093a05b5372cabc",
  "parents": "2fa96c2642924abddafd15cf8c142cd99b2f1468",
  "subject": "Markup: Fix breakage after #1482 (#1589)"
 },
 {
  "author": "Ross Kirsling",
  "date": "2019-06-15 21:53:09 -0700",
  "hash": "2fa96c2642924abddafd15cf8c142cd99b2f1468",
  "parents": "25745fe7e5e5c51bcef96dbbd762008e58cb41a7",
  "subject": "Editorial: Normalize code spacing (#1590)"
 },
 {
  "author": "Sathya Gunasekaran",
  "date": "2019-06-15 15:44:02 -0700",
  "hash": "25745fe7e5e5c51bcef96dbbd762008e58cb41a7",
  "parents": "94c6f97be34f49f14907dc39517774b7d8e49577",
  "subject": "Normative: Lookup constructor.resolve only once (#1506)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-06-15 15:40:18 -0700",
  "hash": "94c6f97be34f49f14907dc39517774b7d8e49577",
  "parents": "2829edc995d55d3bce089576826006f1acebd7d3",
  "subject": "Normative: Add dynamic import() (#1482)"
 },
 {
  "author": "Daniel Ehrenberg",
  "date": "2019-06-15 15:11:00 -0700",
  "hash": "2829edc995d55d3bce089576826006f1acebd7d3",
  "parents": "155b610eaaa6c6e623205c9d23118f28f6a6da6b",
  "subject": "Editorial: Remove \"Outside\" wording for eval errors (#1245)"
 },
 {
  "author": "Daniel Rosenwasser",
  "date": "2019-06-15 15:04:08 -0700",
  "hash": "155b610eaaa6c6e623205c9d23118f28f6a6da6b",
  "parents": "4975f4fdbb427ee959d29190c83534628598bebb",
  "subject": "Editorial: Added 'yield' example for line terminator grammar restrictions (#1193)"
 },
 {
  "author": "Mathias Bynens",
  "date": "2019-06-13 14:50:04 -0700",
  "hash": "4975f4fdbb427ee959d29190c83534628598bebb",
  "parents": "a25df663ddaa8f0b976f0411681635f587be63e0",
  "subject": "Meta: Use shiny new hostname (#1576)"
 },
 {
  "author": "Mike Samuel",
  "date": "2019-06-04 13:15:13 -0700",
  "hash": "a25df663ddaa8f0b976f0411681635f587be63e0",
  "parents": "05c76205a6c86d2d73b078d3a9299533cda69473",
  "subject": "Normative: eval(nonString) should not have observable side effects (#1504)"
 },
 {
  "author": "Mike Samuel",
  "date": "2019-06-04 13:15:13 -0700",
  "hash": "a25df663ddaa8f0b976f0411681635f587be63e0",
  "parents": "05c76205a6c86d2d73b078d3a9299533cda69473",
  "subject": "Normative: eval(nonString) should not have observable side effects (#1504)"
 },
 {
  "author": "Lin Clark",
  "date": "2019-06-03 13:40:48 -0700",
  "hash": "05c76205a6c86d2d73b078d3a9299533cda69473",
  "parents": "f8ea1acad08082d7f6a2a66ce21b7cc395646625",
  "subject": "Layering: Rename Module.Instantiate to Module.Link (#1312)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-06-01 22:02:47 -0700",
  "hash": "f8ea1acad08082d7f6a2a66ce21b7cc395646625",
  "parents": "090334cfac1fbbe85d4e8382c04480d7c43babff",
  "subject": "Editorial: Explicitly unwrap results of IsAccessorDescriptor (#1559)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-06-01 21:57:22 -0700",
  "hash": "090334cfac1fbbe85d4e8382c04480d7c43babff",
  "parents": "fea0b845e01bb6ade47047f9b31e359e297fc38d",
  "subject": "Editorial: Remove mention of \"spread operator\" from introduction (#1557)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-06-01 21:52:58 -0700",
  "hash": "fea0b845e01bb6ade47047f9b31e359e297fc38d",
  "parents": "c682d060446ee126acc355c55c4c32dc32385660",
  "subject": "Editorial: set [[SourceText]] for async arrow functions (#1548)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-06-01 21:51:09 -0700",
  "hash": "c682d060446ee126acc355c55c4c32dc32385660",
  "parents": "935454ef608f4584f5a9c8de95e6fa207579a4ce",
  "subject": "Editorial: Tweak handling of negative `space` values in JSON.stringify (#1545)"
 },
 {
  "author": "Michael Dyck",
  "date": "2019-06-01 21:50:06 -0700",
  "hash": "935454ef608f4584f5a9c8de95e6fa207579a4ce",
  "parents": "181c0a922fa300574e31b875703a3754c91b47a8",
  "subject": "Editorial: \"ECMAScript code execution context\" -> \"execution context\" (#1543)"
 },
 {
  "author": "Michael Ficarra",
  "date": "2019-06-01 21:49:02 -0700",
  "hash": "181c0a922fa300574e31b875703a3754c91b47a8",
  "parents": "77f6b330cd486d81ac2444f3bb10daa7e5aba8df",
  "subject": "Editorial: remove usages of increase/increment and decrease/decrement (#1542)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-06-01 21:46:43 -0700",
  "hash": "77f6b330cd486d81ac2444f3bb10daa7e5aba8df",
  "parents": "659fb6e1daef18bc079ff8adf6e94b9127748721",
  "subject": "Editorial: Use IsInteger abstract op (#1534)"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-06-01 21:45:25 -0700",
  "hash": "659fb6e1daef18bc079ff8adf6e94b9127748721",
  "parents": "7deeb91baad8dbdd060e8135f225b3a6ce5b3591",
  "subject": "Editorial: Add CodePointAt abstract operation (#1532)"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-06-01 21:45:25 -0700",
  "hash": "7deeb91baad8dbdd060e8135f225b3a6ce5b3591",
  "parents": "857153d001b9f39b2e44451bf7f39b81b2e7ea0d",
  "subject": "Editorial: Reference leading/trailing surrogate definitions more (#1532)"
 },
 {
  "author": "Richard Gibson",
  "date": "2019-06-01 21:41:38 -0700",
  "hash": "857153d001b9f39b2e44451bf7f39b81b2e7ea0d",
  "parents": "948baad6d2e026dd637e27d7abc93cbac31597fa",
  "subject": "Editorial: Use consistent format for referencing table columns (#1531)"
 },
 {
  "author": "Aleksey Shvayka",
  "date": "2019-06-01 21:37:34 -0700",
  "hash": "948baad6d2e026dd637e27d7abc93cbac31597fa",
  "parents": "a5375bdad264c8aa264d9c44f57408087761069e",
  "subject": "Editorial: Use IsCallable abstract op (#1529)"
 }
];

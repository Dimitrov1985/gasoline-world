// Russian → English
export const EN = {
  'Нигерия':'Nigeria','Ливия':'Libya','Алжир':'Algeria','Египет':'Egypt',
  'Марокко':'Morocco','ЮАР':'South Africa','Кения':'Kenya','Эфиопия':'Ethiopia',
  'Судан':'Sudan','Тунис':'Tunisia','Гана':'Ghana','Сенегал':'Senegal',
  'Камерун':'Cameroon',"Кот-д'Ивуар":"Côte d'Ivoire",'Ангола':'Angola',
  'Танзания':'Tanzania','Мозамбик':'Mozambique','Зимбабве':'Zimbabwe',
  'Замбия':'Zambia','Уганда':'Uganda','ДР Конго':'DR Congo','Намибия':'Namibia',
  'Мадагаскар':'Madagascar','Мали':'Mali','Нигер':'Niger',
  'Буркина-Фасо':'Burkina Faso','Руанда':'Rwanda','Сомали':'Somalia',
  'Иран':'Iran','Кувейт':'Kuwait','Саудовская Аравия':'Saudi Arabia',
  'ОАЭ':'UAE','Катар':'Qatar','Ирак':'Iraq','Иордания':'Jordan',
  'Израиль':'Israel','Оман':'Oman','Бахрейн':'Bahrain','Ливан':'Lebanon',
  'Россия':'Russia','Казахстан':'Kazakhstan','Азербайджан':'Azerbaijan',
  'Туркменистан':'Turkmenistan','Узбекистан':'Uzbekistan',
  'Афганистан':'Afghanistan','Непал':'Nepal','Шри-Ланка':'Sri Lanka',
  'Пакистан':'Pakistan','Индия':'India','Бангладеш':'Bangladesh',
  'Мьянма':'Myanmar','Филиппины':'Philippines','Камбоджа':'Cambodia',
  'Монголия':'Mongolia','Таиланд':'Thailand','Вьетнам':'Vietnam',
  'Индонезия':'Indonesia','Малайзия':'Malaysia','Китай':'China',
  'Южная Корея':'South Korea','Япония':'Japan','Тайвань':'Taiwan',
  'Сингапур':'Singapore','Турция':'Turkey','Норвегия':'Norway',
  'Нидерланды':'Netherlands','Дания':'Denmark','Швеция':'Sweden',
  'Финляндия':'Finland','Германия':'Germany','Франция':'France',
  'Великобритания':'United Kingdom','Италия':'Italy','Испания':'Spain',
  'Португалия':'Portugal','Греция':'Greece','Австрия':'Austria',
  'Швейцария':'Switzerland','Польша':'Poland','Украина':'Ukraine',
  'Беларусь':'Belarus','Румыния':'Romania','Венгрия':'Hungary',
  'Чехия':'Czech Republic','Болгария':'Bulgaria','Сербия':'Serbia',
  'Хорватия':'Croatia','Бельгия':'Belgium','Ирландия':'Ireland',
  'Литва':'Lithuania','Латвия':'Latvia','Эстония':'Estonia',
  'Молдова':'Moldova','Словакия':'Slovakia','Словения':'Slovenia',
  'США':'USA','Канада':'Canada','Мексика':'Mexico','Венесуэла':'Venezuela',
  'Бразилия':'Brazil','Аргентина':'Argentina','Чили':'Chile',
  'Колумбия':'Colombia','Перу':'Peru','Боливия':'Bolivia',
  'Эквадор':'Ecuador','Парагвай':'Paraguay','Уругвай':'Uruguay',
  'Гватемала':'Guatemala','Куба':'Cuba','Панама':'Panama',
  'Австралия':'Australia','Новая Зеландия':'New Zealand',
}

export function countryName(ruName, lang) {
  if (lang === 'en') return EN[ruName] ?? ruName
  return ruName
}

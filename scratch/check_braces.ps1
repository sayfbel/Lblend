
$content = Get-Content "ProjectWorkshop.jsx" -Raw
$openBraces = ($content.ToCharArray() | Where-Object { $_ -eq '{' }).Count
$closeBraces = ($content.ToCharArray() | Where-Object { $_ -eq '}' }).Count
$openParens = ($content.ToCharArray() | Where-Object { $_ -eq '(' }).Count
$closeParens = ($content.ToCharArray() | Where-Object { $_ -eq ')' }).Count

Write-Host "Braces: $openBraces / $closeBraces"
Write-Host "Parens: $openParens / $closeParens"

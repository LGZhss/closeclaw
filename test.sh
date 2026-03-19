export MY_VAR='`echo injected`'
cat << EOF
Hello ${MY_VAR}
EOF

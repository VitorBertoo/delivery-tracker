package com.vitorbertoo.delivery_tracker_backend.service;

import com.vitorbertoo.delivery_tracker_backend.dto.RegisterRequest;
import com.vitorbertoo.delivery_tracker_backend.model.User;
import com.vitorbertoo.delivery_tracker_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository
                .findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }
        User user =
                User.builder()
                        .name(request.name())
                        .email(request.email())
                        .passwordHash(passwordEncoder.encode(request.password()))
                        .build();
        return userRepository.save(user);
    }
}

package com.example.demo.batch.simulation;

import com.example.demo.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.batch.item.ItemProcessor;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ImportUserProcessor implements ItemProcessor<User, User> {
    @Override
    public User process(User user) throws InterruptedException {
        user.setEmail(user.getEmail().toLowerCase());
        log.info("Processing batch for user: " + user);
        Thread.sleep(30000);
        return user;
    }
}
